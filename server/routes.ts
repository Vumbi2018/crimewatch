import type { Express, NextFunction, Request, Response } from "express";
import {
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createServer, type Server } from "node:http";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { storage } from "./storage";
import { adminHtml } from "./admin-html";
import { adminStore, distanceKm } from "./admin-store";

const PRODUCTION_DOMAIN =
  process.env.PRODUCTION_DOMAIN ||
  process.env.EXPO_PUBLIC_DOMAIN ||
  "crimewatch.lamtoninvestments.com";
const ADMIN_COOKIE_NAME = "cpng_admin";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || process.env.CPNG_ADMIN_PASSWORD || "admin123";
const ADMIN_COOKIE_VALUE = createHash("sha256")
  .update(ADMIN_PASSWORD)
  .digest("hex");
const PASSWORD_ITERATIONS = 210000;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    32,
    "sha256",
  ).toString("hex");
  return `pbkdf2:${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(
  password: string,
  stored: string | null | undefined,
): boolean {
  if (!stored) return false;
  if (!stored.startsWith("pbkdf2:")) {
    return stored === password;
  }

  const [, iterationsText, salt, expectedHash] = stored.split(":");
  const iterations = Number(iterationsText);
  if (!iterations || !salt || !expectedHash) return false;

  const actual = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function defaultUserPassword(username: string): string {
  const envKey = `CRIMEWATCH_${username.toUpperCase()}_PASSWORD`;
  return (
    process.env[envKey] ||
    (username === "admin" ? ADMIN_PASSWORD : `${username}123`)
  );
}

function sanitizeAdminUser<T extends { passwordHash?: string | null }>(
  user: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

const uploadsDir = path.resolve(process.cwd(), "uploads");
const productionReportsCachePath = path.resolve(
  process.cwd(),
  "server",
  "cache",
  "production-reports.json",
);
const PERMISSION_CATALOG = [
  "reports.read",
  "reports.create",
  "reports.update_status",
  "reports.delete",
  "reports.assign",
  "map.view",
  "map.export",
  "users.read",
  "users.manage",
  "stations.read",
  "stations.manage",
  "locations.manage",
  "notifications.send",
  "audit.read",
  "settings.manage",
] as const;

const PERMISSION_PROFILES: Record<string, string[]> = {
  super_admin: [...PERMISSION_CATALOG],
  command_lead: [
    "reports.read",
    "reports.update_status",
    "reports.assign",
    "map.view",
    "map.export",
    "users.read",
    "stations.read",
    "notifications.send",
    "audit.read",
  ],
  dispatcher: [
    "reports.read",
    "reports.create",
    "reports.update_status",
    "reports.assign",
    "map.view",
    "stations.read",
    "notifications.send",
  ],
  field_officer: ["reports.read", "reports.update_status", "map.view"],
  analyst: ["reports.read", "map.view", "map.export", "audit.read"],
  viewer: ["reports.read", "map.view"],
  custom: [],
};

function permissionsForProfile(
  profile: string,
  explicitPermissions?: unknown,
): string[] {
  if (Array.isArray(explicitPermissions)) {
    return explicitPermissions
      .map(String)
      .filter((permission) => PERMISSION_CATALOG.includes(permission as any));
  }
  return PERMISSION_PROFILES[profile] || PERMISSION_PROFILES.viewer;
}

function normalizeAdminUserForResponse<
  T extends {
    role?: string | null;
    permissionProfile?: string | null;
    permissions?: string[] | null;
  },
>(user: T): T {
  const roleProfile =
    user.role === "admin"
      ? "super_admin"
      : user.role === "commander"
        ? "command_lead"
        : user.role === "dispatcher"
          ? "dispatcher"
          : user.role === "officer"
            ? "field_officer"
            : "viewer";
  const permissionProfile = user.permissionProfile || roleProfile;
  const permissions =
    Array.isArray(user.permissions) && user.permissions.length
      ? user.permissions
      : permissionsForProfile(permissionProfile);
  return { ...user, permissionProfile, permissions };
}
function buildAdminUserPayload(body: any, passwordHash?: string) {
  const permissionProfile = String(
    body.permissionProfile || body.permission_profile || "viewer",
  );
  const payload: any = {
    name: String(body.name || "").trim(),
    username: String(body.username || "").trim(),
    role: String(body.role || "viewer"),
    jobTitle: body.jobTitle || null,
    department: body.department || null,
    permissionProfile,
    permissions: permissionsForProfile(permissionProfile, body.permissions),
    commandId: body.commandId || null,
    provinceId: body.provinceId || null,
    districtId: body.districtId || null,
    stationId: body.stationId || null,
    phone: body.phone || null,
    email: body.email || null,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    mfaRequired: Boolean(body.mfaRequired),
    notes: body.notes || null,
  };
  if (passwordHash) payload.passwordHash = passwordHash;
  return payload;
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext =
        path.extname(file.originalname) || getExtByMime(file.mimetype);
      cb(
        null,
        `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`,
      );
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

function getExtByMime(mime: string): string {
  if (mime.startsWith("image/")) return ".jpg";
  if (mime.startsWith("video/")) return ".mp4";
  if (mime.startsWith("audio/")) return ".m4a";
  return ".bin";
}

function buildReferenceNumber(report: {
  id: string;
  submittedAt?: Date | string | null;
}): string {
  const submittedAt = report.submittedAt
    ? new Date(report.submittedAt)
    : new Date();
  const year = Number.isNaN(submittedAt.getTime())
    ? new Date().getUTCFullYear()
    : submittedAt.getUTCFullYear();
  const shortId = report.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CPNG-${year}-${shortId}`;
}

function withReferenceNumber<
  T extends {
    id: string;
    submittedAt?: Date | string | null;
    fileUrl?: string | null;
    tags?: unknown;
  },
>(report: T) {
  const fileUrl = report.fileUrl?.startsWith("/uploads/")
    ? `https://${PRODUCTION_DOMAIN}${report.fileUrl}`
    : report.fileUrl;
  const tags = Array.isArray(report.tags)
    ? report.tags
    : typeof report.tags === "string" && report.tags.length > 0
      ? [report.tags]
      : [];

  return {
    ...report,
    fileUrl,
    tags,
    referenceNumber: buildReferenceNumber(report),
  };
}

async function findNearestDbPoliceStation(latitude: number, longitude: number) {
  try {
    const stations = await storage.listPoliceStations({ activeOnly: true });
    const nearest = stations
      .map((station) => {
        const distance = distanceKm(
          latitude,
          longitude,
          station.latitude,
          station.longitude,
        );
        return {
          ...station,
          province: "",
          district: "",
          commandPhone: station.commandPhone || "",
          commandEmail: station.commandEmail || "",
          commanderName: station.commanderName || "",
          notes: station.notes || "",
          distanceKm: Math.round(distance * 10) / 10,
          withinResponseRadius: distance <= station.responseRadiusKm,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    return nearest || null;
  } catch (error) {
    console.warn("Falling back to JSON police station store:", error);
    return adminStore.nearestStation(latitude, longitude);
  }
}

function isProductionServer(req?: Request): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) return true;
  if (req) {
    const host = req.get("host");
    if (
      host &&
      (host.includes(PRODUCTION_DOMAIN) ||
        host.includes("lamtoninvestments.com"))
    ) {
      return true;
    }
  }
  return false;
}

async function fetchProductionReports() {
  try {
    const response = await fetch(`https://${PRODUCTION_DOMAIN}/api/reports`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      throw new Error(`Production reports request failed: ${response.status}`);
    }

    const reports = (await response.json()) as Array<{
      id: string;
      submittedAt?: string | null;
      fileUrl?: string | null;
      tags?: unknown;
    }>;

    fs.mkdirSync(path.dirname(productionReportsCachePath), { recursive: true });
    fs.writeFileSync(
      productionReportsCachePath,
      JSON.stringify(reports, null, 2),
    );
    return reports;
  } catch (error) {
    if (fs.existsSync(productionReportsCachePath)) {
      console.warn(
        "Using cached production reports because live fetch failed:",
        error,
      );
      return JSON.parse(
        fs.readFileSync(productionReportsCachePath, "utf-8"),
      ) as Array<{
        id: string;
        submittedAt?: string | null;
        fileUrl?: string | null;
        tags?: unknown;
      }>;
    }

    throw error;
  }
}

async function patchProductionReportStatus(id: string, status: string) {
  const response = await fetch(
    `https://${PRODUCTION_DOMAIN}/api/reports/${id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error(`Production status update failed: ${response.status}`);
  }
}

function getCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)]),
  );
}

import { verifySession, signSession, SessionData } from "./cookie-auth";

export function getSession(req: Request): SessionData | null {
  const cookieVal = getCookies(req.headers.cookie)[ADMIN_COOKIE_NAME];
  if (!cookieVal) return null;
  if (cookieVal === ADMIN_COOKIE_VALUE) {
    return { username: "admin", role: "admin" };
  }
  return verifySession(cookieVal);
}

function isAdminAuthenticated(req: Request): boolean {
  return getSession(req) !== null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ message: "Admin login required" });
  }
  next();
}

function requireAdminWrite(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ message: "Admin login required" });
  }
  if (session.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
  next();
}

function adminLoginHtml(errorMessage = ""): string {
  const error = errorMessage ? `<p class="error">${errorMessage}</p>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crime Reporting PNG - Admin Login</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0f1724;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .login-card {
      width: min(420px, calc(100vw - 32px));
      background: #1a2744;
      border: 1px solid #2d3a4f;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.28);
    }
    h1 { margin: 0 0 6px; font-size: 22px; }
    p { margin: 0 0 22px; color: #94a3b8; }
    label { display: block; margin-bottom: 8px; font-size: 13px; color: #cbd5e1; }
    input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #334155;
      background: #0f1724;
      color: #f8fafc;
      font-size: 16px;
      margin-bottom: 16px;
    }
    button {
      width: 100%;
      border: none;
      border-radius: 10px;
      padding: 12px 16px;
      background: #1d4ed8;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
    .error {
      margin: 0 0 14px;
      color: #fca5a5;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <form class="login-card" method="POST" action="/api/admin/login">
    <h1>Crime Reporting PNG</h1>
    <p>Sign in to view and manage submitted reports.</p>
    ${error}
    <label for="username">Username</label>
    <input id="username" name="username" type="text" placeholder="e.g. admin or viewer" autocomplete="username" autofocus required>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Open Admin Portal</button>
  </form>
</body>
</html>`;
}

async function forwardToProduction(reportData: any) {
  try {
    const isProduction = isProductionServer();
    if (isProduction) return;

    const prodUrl = `https://${PRODUCTION_DOMAIN}/api/reports`;
    const response = await fetch(prodUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });
    if (response.ok) {
      console.log("Report forwarded to production successfully");
    } else {
      console.error("Failed to forward report to production:", response.status);
    }
  } catch (err) {
    console.error("Error forwarding report to production:", err);
  }
}

async function forwardFileToProduction(
  filePath: string,
  mimeType: string,
  originalName: string,
): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append("file", blob, originalName);

    const prodResponse = await fetch(
      `https://${PRODUCTION_DOMAIN}/api/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (prodResponse.ok) {
      const data = (await prodResponse.json()) as { fileUrl: string };
      return data.fileUrl;
    }
    console.error("Failed to forward file to production:", prodResponse.status);
    return null;
  } catch (err) {
    console.error("Error forwarding file to production:", err);
    return null;
  }
}

async function seedDefaultUsers() {
  try {
    const admin = await storage.getAdminUserByUsername("admin");
    if (!admin) {
      await storage.createAdminUser({
        name: "Administrator",
        username: "admin",
        passwordHash: hashPassword(defaultUserPassword("admin")),
        role: "admin",
        isActive: true,
      });
      console.log("Seeded admin user.");
    }
    const viewer = await storage.getAdminUserByUsername("viewer");
    if (!viewer) {
      await storage.createAdminUser({
        name: "Viewer",
        username: "viewer",
        passwordHash: hashPassword(defaultUserPassword("viewer")),
        role: "viewer",
        isActive: true,
      });
      console.log("Seeded viewer user.");
    }
    const officer = await storage.getAdminUserByUsername("officer");
    let officerUser = officer;
    if (!officer) {
      officerUser = await storage.createAdminUser({
        name: "Officer",
        username: "officer",
        passwordHash: hashPassword(defaultUserPassword("officer")),
        role: "officer",
        isActive: true,
      });
      console.log("Seeded officer user.");
    }
    if (officerUser) {
      const profile = await storage.getOfficerProfileByUserId(officerUser.id);
      if (!profile) {
        await storage.createOfficerProfile({
          userId: officerUser.id,
          rank: "Sergeant",
          responsibilityAreaName: "Port Moresby Town",
          latitude: -9.4789,
          longitude: 147.1494,
          radiusKm: 15.0,
          isActive: true,
        });
        console.log("Seeded default officer profile.");
      }
    }
  } catch (err) {
    console.error("Failed to seed default users:", err);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDefaultUsers();

  app.post("/api/admin/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();

    if (username) {
      const user = await storage.getAdminUserByUsername(username);
      if (
        user &&
        user.isActive &&
        verifyPassword(password, user.passwordHash)
      ) {
        res.setHeader(
          "Set-Cookie",
          `${ADMIN_COOKIE_NAME}=${encodeURIComponent(signSession(user.username, user.role))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
        );
        return res.redirect("/admin");
      }
    } else {
      if (password === ADMIN_PASSWORD) {
        res.setHeader(
          "Set-Cookie",
          `${ADMIN_COOKIE_NAME}=${encodeURIComponent(signSession("admin", "admin"))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
        );
        return res.redirect("/admin");
      }
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res
      .status(401)
      .send(adminLoginHtml("Incorrect credentials. Please try again."));
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.setHeader(
      "Set-Cookie",
      `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    );
    res.redirect("/admin");
  });

  app.get("/uploads/:filename", (req, res) => {
    if (isProductionServer(req)) {
      return res.status(404).send("File not found on production server");
    }
    res.redirect(
      302,
      `https://${PRODUCTION_DOMAIN}/uploads/${encodeURIComponent(req.params.filename)}`,
    );
  });
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isProduction = isProductionServer(req);

    if (!isProduction) {
      const prodFileUrl = await forwardFileToProduction(
        req.file.path,
        req.file.mimetype,
        req.file.originalname || `upload${path.extname(req.file.path)}`,
      );
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      if (prodFileUrl) {
        return res.json({ fileUrl: prodFileUrl });
      }
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const latitude =
        req.body?.latitude !== null && req.body?.latitude !== undefined
          ? Number(req.body.latitude)
          : NaN;
      const longitude =
        req.body?.longitude !== null && req.body?.longitude !== undefined
          ? Number(req.body.longitude)
          : NaN;
      const nearestStation =
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? await findNearestDbPoliceStation(latitude, longitude)
          : null;
      const reportData = {
        ...req.body,
        agency: nearestStation?.name || req.body.agency,
      };
      const report = await storage.createEvidenceReport(reportData);
      forwardToProduction(reportData);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        try {
          const officers = await storage.listOfficerProfiles();
          for (const officer of officers) {
            if (officer.isActive) {
              const dist = distanceKm(
                latitude,
                longitude,
                officer.latitude,
                officer.longitude,
              );
              if (dist <= officer.radiusKm) {
                await storage.createReportAssignment({
                  reportId: report.id,
                  officerUserId: officer.userId,
                  assignmentType: "automatic",
                  assignmentReason: `Report coordinates are within ${dist.toFixed(1)} km of officer's coverage area (${officer.radiusKm} km radius).`,
                  matchedAreaName: officer.responsibilityAreaName,
                  status: "Sent to Officer",
                });
                console.log(
                  `Automatically assigned report ${report.id} to officer ${officer.userId}`,
                );
              }
            }
          }
        } catch (routingError) {
          console.error("Failed to automatically route report:", routingError);
        }
      }
      if (nearestStation) {
        try {
          await storage.createReportDispatch({
            reportId: report.id,
            stationId: nearestStation.id,
            distanceKm: nearestStation.distanceKm,
            withinResponseRadius: nearestStation.withinResponseRadius,
            status: "notified",
          });
          await storage.createNotificationLog({
            stationId: nearestStation.id,
            reportId: report.id,
            title: "Immediate crime report dispatch",
            message:
              "New " +
              report.priority +
              " priority " +
              report.evidenceType +
              " report near " +
              nearestStation.name +
              " (" +
              nearestStation.distanceKm +
              " km). Reference: " +
              buildReferenceNumber(report),
            channel: "console",
            recipient:
              nearestStation.commandEmail ||
              nearestStation.commandPhone ||
              nearestStation.name,
            status: "sent",
          });
        } catch (notificationError) {
          adminStore.createNotification({
            stationId: nearestStation.id,
            reportId: report.id,
            title: "Immediate crime report dispatch",
            message:
              "New " +
              report.priority +
              " priority " +
              report.evidenceType +
              " report near " +
              nearestStation.name +
              " (" +
              nearestStation.distanceKm +
              " km). Reference: " +
              buildReferenceNumber(report),
            channel: "console",
            recipient:
              nearestStation.commandEmail ||
              nearestStation.commandPhone ||
              nearestStation.name,
          });
        }
      }
      res.status(201).json({
        ...withReferenceNumber(report),
        nearestStation,
      });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  app.get("/api/police-stations", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      res.json(await storage.listPoliceStations({ activeOnly: true }));
    } catch (error) {
      res.json(adminStore.listStations().filter((station) => station.isActive));
    }
  });

  app.get("/api/police-stations/nearest", async (req, res) => {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res
        .status(400)
        .json({ message: "Valid latitude and longitude are required" });
    }
    res.json(await findNearestDbPoliceStation(latitude, longitude));
  });

  app.get("/api/admin/location/commands", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listPoliceCommands());
  });

  app.post(
    "/api/admin/location/commands",
    requireAdminWrite,
    async (req, res) => {
      res.status(201).json(await storage.createPoliceCommand(req.body));
    },
  );

  app.get("/api/admin/location/provinces", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(
      await storage.listProvinces(req.query.commandId as string | undefined),
    );
  });

  app.post(
    "/api/admin/location/provinces",
    requireAdminWrite,
    async (req, res) => {
      res.status(201).json(await storage.createProvince(req.body));
    },
  );

  app.get("/api/admin/location/districts", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(
      await storage.listDistricts(req.query.provinceId as string | undefined),
    );
  });

  app.post(
    "/api/admin/location/districts",
    requireAdminWrite,
    async (req, res) => {
      res.status(201).json(await storage.createDistrict(req.body));
    },
  );

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const users = await storage.listAdminUsers();
    res.json(
      users.map(function (user) {
        return sanitizeAdminUser(normalizeAdminUserForResponse(user));
      }),
    );
  });

  app.post("/api/admin/users", requireAdminWrite, async (req, res) => {
    const password = String(
      req.body?.password ||
        defaultUserPassword(String(req.body?.username || "user")),
    );
    const payload = buildAdminUserPayload(req.body, hashPassword(password));
    if (!payload.name || !payload.username) {
      return res
        .status(400)
        .json({ message: "Name and username are required." });
    }
    const created = await storage.createAdminUser(payload);
    res
      .status(201)
      .json(sanitizeAdminUser(normalizeAdminUserForResponse(created)));
  });

  app.patch("/api/admin/users/:id", requireAdminWrite, async (req, res) => {
    const password = String(req.body?.password || "").trim();
    const payload = buildAdminUserPayload(
      req.body,
      password ? hashPassword(password) : undefined,
    );
    delete payload.username;
    const updated = await storage.updateAdminUser(req.params.id, payload);
    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(sanitizeAdminUser(normalizeAdminUserForResponse(updated)));
  });

  app.get("/api/admin/police-stations", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(
      await storage.listPoliceStations({
        commandId: req.query.commandId as string | undefined,
        provinceId: req.query.provinceId as string | undefined,
        districtId: req.query.districtId as string | undefined,
      }),
    );
  });

  app.post(
    "/api/admin/police-stations",
    requireAdminWrite,
    async (req, res) => {
      res.status(201).json(await storage.createPoliceStation(req.body));
    },
  );

  app.get("/api/admin/deleted-reports", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listDeletedReportAudits());
  });

  app.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listNotificationLogs());
  });

  app.post("/api/admin/notifications", requireAdminWrite, async (req, res) => {
    const notification = await storage.createNotificationLog({
      ...req.body,
      status: "sent",
    });
    res.status(201).json(notification);
  });

  app.get("/api/reports", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const reports = await storage.getAllEvidenceReports();

      if (reports.length === 0 && !isProductionServer()) {
        const productionReports = await fetchProductionReports();
        return res.json(productionReports.map(withReferenceNumber));
      }

      res.json(reports.map(withReferenceNumber));
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const report = await storage.getEvidenceReportById(req.params.id);
      if (report) {
        return res.json(withReferenceNumber(report));
      }

      if (!isProductionServer()) {
        const productionReports = await fetchProductionReports();
        const productionReport = productionReports.find(
          (item) => item.id === req.params.id,
        );
        if (productionReport) {
          return res.json(withReferenceNumber(productionReport));
        }
      }

      return res.status(404).json({ message: "Report not found" });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get("/api/reports/:id/assignments", requireAdmin, async (req, res) => {
    try {
      const list = await storage.listReportAssignments({
        reportId: req.params.id,
      });
      const detailed = [];
      const usersList = await storage.listAdminUsers();
      for (const assignment of list) {
        const user = usersList.find((u) => u.id === assignment.officerUserId);
        detailed.push({
          ...assignment,
          officerName: user ? user.name : "Unknown Officer",
        });
      }
      res.json(detailed);
    } catch (error) {
      console.error("Error fetching report assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments." });
    }
  });

  app.post(
    "/api/admin/reports/:id/assign",
    requireAdminWrite,
    async (req, res) => {
      const { id } = req.params;
      const { officerUserId } = req.body;
      try {
        const assignment = await storage.createReportAssignment({
          reportId: id,
          officerUserId,
          assignmentType: "manual",
          assignmentReason: "Assigned manually by dispatcher.",
          status: "Sent to Officer",
        });
        res.status(201).json(assignment);
      } catch (error) {
        console.error("Error manual assigning:", error);
        res.status(500).json({ message: "Failed to assign officer." });
      }
    },
  );

  app.delete("/api/reports/:id", requireAdminWrite, async (req, res) => {
    try {
      const reason = String(req.body?.reason || "").trim();
      if (reason.length < 8) {
        return res
          .status(400)
          .json({ message: "Deletion reason must be at least 8 characters." });
      }

      const report = await storage.getEvidenceReportById(req.params.id);
      if (!report) {
        return res.status(404).json({
          message:
            "Report not found or cannot be deleted from this environment.",
        });
      }

      const audit = await storage.deleteEvidenceReportWithAudit(req.params.id, {
        reason,
        deletedBy: "admin",
        referenceNumber: withReferenceNumber(report).referenceNumber,
      });

      res.json({ message: "Report deleted", auditId: audit?.id });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  app.patch("/api/reports/:id/status", requireAdminWrite, async (req, res) => {
    try {
      const { status } = req.body;
      const localReport = await storage.getEvidenceReportById(req.params.id);

      if (localReport || isProductionServer()) {
        await storage.updateEvidenceReportStatus(req.params.id, status);
      } else {
        await patchProductionReportStatus(req.params.id, status);
      }

      res.json({ message: "Status updated" });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });
  app.post("/api/officer/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();

    const user = await storage.getAdminUserByUsername(username);
    if (
      !user ||
      !user.isActive ||
      !verifyPassword(password, user.passwordHash)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (user.role !== "officer" && user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "User is not a police officer." });
    }

    const profile = await storage.getOfficerProfileByUserId(user.id);
    res.json({
      success: true,
      officerProfile: {
        userId: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        rank: profile?.rank || "Officer",
        responsibilityAreaName:
          profile?.responsibilityAreaName || "General Coverage Area",
        latitude: profile?.latitude || -9.4438,
        longitude: profile?.longitude || 147.1803,
        radiusKm: profile?.radiusKm || 10,
      },
    });
  });

  app.get("/api/officer/assignments", async (req, res) => {
    const officerUserId = String(req.query.officerUserId || "");
    if (!officerUserId) {
      return res.status(400).json({ message: "officerUserId is required." });
    }
    try {
      const list = await storage.listReportAssignments({ officerUserId });
      const detailed = [];
      for (const assignment of list) {
        const report = await storage.getEvidenceReportById(assignment.reportId);
        if (report) {
          detailed.push({
            ...assignment,
            report: withReferenceNumber(report),
          });
        }
      }
      res.json(detailed);
    } catch (error) {
      console.error("Error listing assignments:", error);
      res.status(500).json({ message: "Failed to list assignments." });
    }
  });

  app.patch("/api/officer/assignments/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await storage.updateReportAssignmentStatus(id, status);
      // Also update associated report status if relevant
      const assignments = await storage.listReportAssignments();
      const assignment = assignments.find((a) => a.id === id);
      if (assignment) {
        let reportStatus = "Pending";
        if (status === "Resolved") reportStatus = "Resolved";
        else if (status === "Rejected" || status === "Failed")
          reportStatus = "Rejected";
        else if (status === "Acknowledged") reportStatus = "Pending";
        else if (status === "On Route") reportStatus = "Pending";

        await storage.updateEvidenceReportStatus(
          assignment.reportId,
          reportStatus,
        );
      }
      res.json({ success: true, message: "Assignment status updated." });
    } catch (error) {
      console.error("Error updating assignment status:", error);
      res.status(500).json({ message: "Failed to update assignment status." });
    }
  });

  app.post("/api/officer/assignments/:id/notes", async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    try {
      const assignments = await storage.listReportAssignments();
      const assignment = assignments.find((a) => a.id === id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found." });
      }
      const createdNote = await storage.createReportNote({
        reportId: assignment.reportId,
        noteType: "officer_update",
        note,
        createdBy: "officer",
      });
      res.json(createdNote);
    } catch (error) {
      console.error("Error creating report note:", error);
      res.status(500).json({ message: "Failed to create report note." });
    }
  });

  app.get("/api/reports/:id/notes", async (req, res) => {
    try {
      res.json(await storage.listReportNotes(req.params.id));
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/admin", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    const session = getSession(req);
    if (!session) {
      return res.status(200).send(adminLoginHtml());
    }
    const roleScript = `<script>window.currentUser = { username: "${session.username}", role: "${session.role}" };</script>`;
    const responseHtml = adminHtml.replace("<head>", `<head>\n  ${roleScript}`);
    res.status(200).send(responseHtml);
  });

  const httpServer = createServer(app);
  return httpServer;
}
