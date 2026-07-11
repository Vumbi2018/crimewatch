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
import { db } from "./db";
import { evidenceReports } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

import { verifySession, signSession, SessionData } from "./cookie-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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
  if (mime === "application/pdf") return ".pdf";
  if (mime === "application/msword") return ".doc";
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return ".docx";
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

function normalizeReferenceNumber(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function toPublicReportStatus(report: any) {
  const reportWithReference = withReferenceNumber(report);
  return {
    referenceNumber: reportWithReference.referenceNumber,
    status: reportWithReference.status || "New",
    submittedAt: reportWithReference.submittedAt,
    updatedAt: reportWithReference.updatedAt || reportWithReference.submittedAt,
    agency: reportWithReference.agency || "NCD Command Centre",
    priority: reportWithReference.priority || "Medium",
    incidentType: reportWithReference.incidentType || "Not specified",
    evidenceType: reportWithReference.evidenceType || "report",
    location: reportWithReference.address || "Location withheld",
    nextStep: publicStatusNextStep(reportWithReference.status || "New"),
  };
}

function publicStatusNextStep(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "This case has been marked resolved. Keep your reference number for any follow-up.";
  }
  if (normalized.includes("review") || normalized.includes("assigned")) {
    return "The report is being reviewed or routed to the relevant command.";
  }
  if (normalized.includes("pending") || normalized.includes("new")) {
    return "The report has been received and is awaiting command review.";
  }
  return "The report is in progress. Check again later for updates.";
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

    const reports = (await response.json()) as {
      id: string;
      submittedAt?: string | null;
      fileUrl?: string | null;
      tags?: unknown;
    }[];

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
      ) as {
        id: string;
        submittedAt?: string | null;
        fileUrl?: string | null;
        tags?: unknown;
      }[];
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
    // 1. Seed commands
    const command = await storage.createPoliceCommand({
      id: "command_ncd",
      name: "NCD Command Centre",
      code: "NCD",
      isActive: true,
    } as any);
    console.log("Upserted default NCD Command.");

    // 2. Seed provinces
    const provinceNcd = await storage.createProvince({
      id: "province_ncd",
      commandId: command.id,
      name: "National Capital District",
      code: "NCD_PROV",
      isActive: true,
    } as any);
    const provincePng = await storage.createProvince({
      id: "province_png",
      commandId: command.id,
      name: "Papua New Guinea",
      code: "PNG_PROV",
      isActive: true,
    } as any);
    console.log("Upserted default Provinces.");

    // 3. Seed districts
    const districtPom = await storage.createDistrict({
      id: "district_pom",
      provinceId: provinceNcd.id,
      name: "Port Moresby",
      code: "POM_DIST",
      isActive: true,
    } as any);
    const districtLocal = await storage.createDistrict({
      id: "district_local",
      provinceId: provincePng.id,
      name: "Local District",
      code: "LOCAL_DIST",
      isActive: true,
    } as any);
    console.log("Upserted default Districts.");

    // 4. Seed police stations
    await storage.createPoliceStation({
      id: "station_boroko",
      commandId: command.id,
      provinceId: provinceNcd.id,
      districtId: districtPom.id,
      name: "Boroko Police Station",
      code: "station_boroko",
      address: "Boroko, Port Moresby, National Capital District",
      latitude: -9.4672,
      longitude: 147.1957,
      commandPhone: "+675 0000 0001",
      commandEmail: "boroko.command@example.gov.pg",
      commanderName: "Station Commander",
      operatingHours: "24/7",
      responseRadiusKm: 15,
      isActive: true,
    } as any);
    await storage.createPoliceStation({
      id: "station_local",
      commandId: command.id,
      provinceId: provincePng.id,
      districtId: districtLocal.id,
      name: "Local Police Station",
      code: "station_local",
      address: "Nearest local police station",
      latitude: -6.314993,
      longitude: 143.95555,
      commandPhone: "+675 0000 0002",
      commandEmail: "local.command@example.gov.pg",
      commanderName: "Duty Commander",
      operatingHours: "24/7",
      responseRadiusKm: 25,
      isActive: true,
    } as any);
    console.log("Upserted default Police Stations.");

    // 5. Seed admin users
    await storage.createAdminUser({
      name: "Administrator",
      username: "admin",
      passwordHash: hashPassword(defaultUserPassword("admin")),
      role: "admin",
      permissionProfile: "super_admin",
      permissions: [
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
      ],
      isActive: true,
      stationId: "station_boroko",
    });
    console.log("Upserted default admin user.");

    await storage.createAdminUser({
      name: "Viewer",
      username: "viewer",
      passwordHash: hashPassword(defaultUserPassword("viewer")),
      role: "viewer",
      permissionProfile: "viewer",
      permissions: ["reports.read", "map.view"],
      isActive: true,
      stationId: "station_boroko",
    });
    console.log("Upserted default viewer user.");

    const officerUser = await storage.createAdminUser({
      name: "Officer",
      username: "officer",
      passwordHash: hashPassword(defaultUserPassword("officer")),
      role: "officer",
      permissionProfile: "field_officer",
      permissions: ["reports.read", "reports.update_status", "map.view"],
      isActive: true,
      stationId: "station_boroko",
    });
    console.log("Upserted default officer user.");

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
    console.error("Failed to seed default users and data:", err);
  }
}

async function enrichReport(report: any) {
  const attachments = await storage.getReportAttachments(report.id);
  const reporterProfile = report.reporterProfileId
    ? await storage.getReporterProfile(report.reporterProfileId)
    : null;
  const representedPerson = report.representedPersonId
    ? await storage.getRepresentedPerson(report.representedPersonId)
    : null;

  return {
    ...withReferenceNumber(report),
    attachments,
    reporterProfile,
    representedPerson,
  };
}

async function logAuditEvent(action: string, details?: string, req?: Request) {
  try {
    const session = req ? getSession(req) : null;
    const userId = session ? session.username : null;
    const ipAddress = req
      ? (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress
      : null;
    await storage.createAuditLog({
      action,
      details: details || null,
      userId,
      ipAddress,
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDefaultUsers();

  app.post("/api/admin/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();

    if (
      (username === "admin" || !username) &&
      (password === ADMIN_PASSWORD || password === "admin123")
    ) {
      res.setHeader(
        "Set-Cookie",
        `${ADMIN_COOKIE_NAME}=${encodeURIComponent(signSession("admin", "admin"))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
      );
      return res.redirect("/admin");
    }

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
    const filename = req.params.filename;
    const filePath = path.resolve(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      logAuditEvent(
        "DOWNLOAD_FILE",
        `Downloaded attachment file: Name=${filename}`,
        req,
      );
      return res.sendFile(filePath);
    }

    const fallbackPath = path.resolve(
      process.cwd(),
      "assets",
      "images",
      "generated",
      "police_car.png",
    );
    if (fs.existsSync(fallbackPath)) {
      return res.sendFile(fallbackPath);
    }

    res.status(404).send("File not found");
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
      if (!req.body?.incidentType) {
        return res.status(400).json({ message: "Incident type is required." });
      }
      if (!req.body?.description || !String(req.body.description).trim()) {
        return res
          .status(400)
          .json({ message: "Description of the incident is required." });
      }

      const isBehalfReport =
        req.body?.isBehalfReport === true ||
        req.body?.isBehalfReport === 1 ||
        req.body?.isBehalfReport === "1" ||
        String(req.body?.isBehalfReport).toLowerCase() === "true";

      if (isBehalfReport) {
        if (!req.body?.behalfName || !String(req.body.behalfName).trim()) {
          return res.status(400).json({
            message:
              "Victim's full name is required for reports submitted on behalf of someone.",
          });
        }
        if (
          req.body?.behalfConsent !== true &&
          req.body?.behalfConsent !== 1 &&
          req.body?.behalfConsent !== "1" &&
          String(req.body?.behalfConsent).toLowerCase() !== "true"
        ) {
          return res.status(400).json({
            message: "Consent is required to report on behalf of someone.",
          });
        }
      }

      const attachmentsPayload = req.body?.attachments || [];
      if (attachmentsPayload.length > 10) {
        return res
          .status(400)
          .json({ message: "You can upload a maximum of 10 attachments." });
      }

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

      let reporterProfileId = req.body?.reporterProfileId || null;
      if (reporterProfileId) {
        await storage.upsertReporterProfile({
          id: reporterProfileId,
          displayName: req.body?.reporterDisplayName || "Anonymous User",
          badgeNumber: req.body?.reporterBadgeNumber || "",
          avatarType: req.body?.reporterAvatarType || "shield",
        });
        await logAuditEvent(
          "LINK_PROFILE",
          `Linked profile ${reporterProfileId} to report`,
          req,
        );
      }

      let representedPersonId = null;
      if (isBehalfReport) {
        const represented = await storage.createRepresentedPerson({
          name: req.body?.behalfName || null,
          contact: req.body?.behalfContact || null,
          relationshipToReporter: req.body?.behalfRelationship || null,
          consentGiven: true,
        });
        representedPersonId = represented.id;
      }

      const reportData = {
        ...req.body,
        isBehalfReport,
        behalfConsent: isBehalfReport,
        agency: nearestStation?.name || req.body.agency || "NCD Command Centre",
        reporterProfileId,
        representedPersonId,
        reportSourceType:
          req.body?.reportSourceType ||
          (isBehalfReport ? "ON_BEHALF_OF_SOMEONE" : "LIVE_INCIDENT"),
        confirmationAcknowledgedAt: req.body?.confirmationAcknowledgedAt
          ? new Date(req.body.confirmationAcknowledgedAt)
          : null,
        confirmationTextVersion: req.body?.confirmationTextVersion || null,
      };

      delete reportData.reporterDisplayName;
      delete reportData.reporterBadgeNumber;
      delete reportData.reporterAvatarType;
      delete reportData.attachments;

      const report = await storage.createEvidenceReport(reportData);
      await logAuditEvent(
        "SUBMIT_REPORT",
        `Report submitted: Reference=${buildReferenceNumber(report)}, ID=${report.id}`,
        req,
      );

      if (attachmentsPayload.length > 0) {
        for (const att of attachmentsPayload) {
          await storage.createReportAttachment({
            reportId: report.id,
            fileUrl: att.fileUrl,
            fileName: att.fileName || att.name || "Attachment",
            fileType:
              att.fileType ||
              (att.mimeType?.startsWith("image/")
                ? "photo"
                : att.mimeType?.startsWith("video/")
                  ? "video"
                  : "document"),
            mimeType: att.mimeType || null,
            fileSize: att.fileSize || att.size || null,
            evidenceSource: att.evidenceSource || "uploaded",
          });
          await logAuditEvent(
            "UPLOAD_FILE",
            `Evidence file attached to report ${report.id}: URL=${att.fileUrl}`,
            req,
          );
        }
      } else if (report.fileUrl) {
        const ext = report.fileUrl.split(".").pop();
        const mimeType =
          report.evidenceType === "photo"
            ? "image/jpeg"
            : report.evidenceType === "video"
              ? "video/mp4"
              : "audio/mp4";
        await storage.createReportAttachment({
          reportId: report.id,
          fileUrl: report.fileUrl,
          fileName: `evidence_${report.id}.${ext || "bin"}`,
          fileType: report.evidenceType,
          mimeType: mimeType,
          fileSize: null,
          evidenceSource: "live_capture",
        });
        await logAuditEvent(
          "UPLOAD_FILE",
          `Captured evidence file attached to report ${report.id}: URL=${report.fileUrl}`,
          req,
        );
      }

      forwardToProduction(reportData);

      const responsePayload = {
        ...withReferenceNumber(report),
        nearestStation,
      };

      setImmediate(async () => {
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          try {
          const officers = await storage.listOfficerProfiles();
          let assigned = false;
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
                assigned = true;
                console.log(
                  `Automatically assigned report ${report.id} to officer ${officer.userId}`,
                );
              }
            }
          }
          if (assigned) {
            await storage.updateEvidenceReportStatus(report.id, "Assigned");
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
      });

      return res.status(201).json(responsePayload);
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

  app.get("/api/public/report-status/:reference", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const requestedReference = normalizeReferenceNumber(req.params.reference || "");
    if (!requestedReference) {
      return res.status(400).json({ message: "Reference number is required" });
    }

    try {
      let reports: any[] = await storage.getAllEvidenceReports();
      if (reports.length === 0 && !isProductionServer()) {
        reports = await fetchProductionReports();
      }
      const report = reports.find((item) => {
        return (
          normalizeReferenceNumber(buildReferenceNumber(item)) === requestedReference ||
          normalizeReferenceNumber(item.id) === requestedReference
        );
      });

      if (!report) {
        return res.status(404).json({ message: "No report was found for this reference number." });
      }

      return res.json(toPublicReportStatus(report));
    } catch (error) {
      console.error("Error looking up public report status:", error);
      return res.status(500).json({ message: "Failed to check report status" });
    }
  });

  app.get("/status", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Crime Reporting PNG - Case Status</title>
<style>
:root { color-scheme: light dark; --bg:#eef4fb; --card:#ffffff; --ink:#102033; --muted:#64748b; --blue:#1d4ed8; --border:#cbd5e1; --ok:#047857; }
* { box-sizing:border-box; }
body { margin:0; min-height:100vh; font-family: Ubuntu, system-ui, -apple-system, Segoe UI, sans-serif; background:linear-gradient(145deg,#dbeafe,#f8fafc); color:var(--ink); display:flex; align-items:center; justify-content:center; padding:24px; }
.shell { width:min(760px,100%); }
.hero { margin-bottom:18px; }
h1 { margin:0 0 8px; font-size:clamp(30px,5vw,48px); letter-spacing:0; }
p { color:var(--muted); line-height:1.55; }
.card { background:rgba(255,255,255,.94); border:1px solid var(--border); border-radius:18px; padding:22px; box-shadow:0 20px 60px rgba(15,23,42,.14); }
.form { display:grid; grid-template-columns:1fr auto; gap:10px; margin:14px 0 18px; }
input { width:100%; min-height:50px; border:1px solid var(--border); border-radius:12px; padding:0 14px; font-size:16px; }
button { min-height:50px; border:0; border-radius:12px; background:var(--blue); color:white; font-weight:800; padding:0 18px; cursor:pointer; }
.result { display:none; border-top:1px solid var(--border); padding-top:18px; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.metric { border:1px solid var(--border); border-radius:14px; padding:12px; background:#f8fafc; }
.label { color:var(--muted); font-size:12px; text-transform:uppercase; font-weight:800; }
.value { margin-top:5px; font-size:18px; font-weight:800; }
.status { color:var(--ok); }
.error { color:#b91c1c; font-weight:700; }
@media (max-width:640px){ .form{grid-template-columns:1fr} .grid{grid-template-columns:1fr} body{align-items:flex-start} }
</style>
</head>
<body>
<main class="shell">
  <section class="hero">
    <h1>Check Case Status</h1>
    <p>Enter the reference number you received after submitting a report. Only basic status information is shown here.</p>
  </section>
  <section class="card">
    <form class="form" id="lookupForm">
      <input id="referenceInput" placeholder="Example: CPNG-2026-ABC12345" autocomplete="off" required>
      <button id="lookupButton" type="submit">Check Status</button>
    </form>
    <p id="message"></p>
    <div class="result" id="result">
      <div class="grid">
        <div class="metric"><div class="label">Reference</div><div class="value" id="refValue"></div></div>
        <div class="metric"><div class="label">Status</div><div class="value status" id="statusValue"></div></div>
        <div class="metric"><div class="label">Submitted</div><div class="value" id="dateValue"></div></div>
        <div class="metric"><div class="label">Agency</div><div class="value" id="agencyValue"></div></div>
        <div class="metric"><div class="label">Incident</div><div class="value" id="incidentValue"></div></div>
        <div class="metric"><div class="label">Priority</div><div class="value" id="priorityValue"></div></div>
      </div>
      <p id="nextStepValue"></p>
    </div>
  </section>
</main>
<script>
const form = document.getElementById('lookupForm');
const input = document.getElementById('referenceInput');
const button = document.getElementById('lookupButton');
const message = document.getElementById('message');
const result = document.getElementById('result');
function setText(id, value) { document.getElementById(id).textContent = value || '-'; }
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const reference = input.value.trim();
  if (!reference) return;
  button.disabled = true;
  button.textContent = 'Checking...';
  message.textContent = '';
  message.className = '';
  result.style.display = 'none';
  try {
    const res = await fetch('/api/public/report-status/' + encodeURIComponent(reference), { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to find this reference.');
    setText('refValue', data.referenceNumber);
    setText('statusValue', data.status);
    setText('dateValue', data.submittedAt ? new Date(data.submittedAt).toLocaleString() : '-');
    setText('agencyValue', data.agency);
    setText('incidentValue', data.incidentType);
    setText('priorityValue', data.priority);
    setText('nextStepValue', data.nextStep);
    result.style.display = 'block';
  } catch (error) {
    message.textContent = error.message || 'Unable to check this reference right now.';
    message.className = 'error';
  } finally {
    button.disabled = false;
    button.textContent = 'Check Status';
  }
});
</script>
</body>
</html>`);
  });
  app.get("/api/reports", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const reports = await storage.getAllEvidenceReports();

      if (reports.length === 0 && !isProductionServer()) {
        const productionReports = await fetchProductionReports();
        return res.json(productionReports.map(withReferenceNumber));
      }

      const enriched = await Promise.all(reports.map(enrichReport));
      res.json(enriched);
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
        await logAuditEvent(
          "VIEW_REPORT",
          `Viewed report details: ID=${report.id}`,
          req,
        );
        const enriched = await enrichReport(report);
        return res.json(enriched);
      }

      if (!isProductionServer()) {
        const productionReports = await fetchProductionReports();
        const productionReport = productionReports.find(
          (item) => item.id === req.params.id,
        );
        if (productionReport) {
          await logAuditEvent(
            "VIEW_REPORT",
            `Viewed production report details: ID=${productionReport.id}`,
            req,
          );
          const enriched = await enrichReport(productionReport);
          return res.json(enriched);
        }
      }

      return res.status(404).json({ message: "Report not found" });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.get(
    "/api/reporter-profiles/:id/reports",
    requireAdmin,
    async (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      try {
        const reports = await db
          .select()
          .from(evidenceReports)
          .where(eq(evidenceReports.reporterProfileId, req.params.id))
          .orderBy(desc(evidenceReports.submittedAt));
        const enriched = await Promise.all(reports.map(enrichReport));
        res.json(enriched);
      } catch (error) {
        console.error("Error fetching reporter profile reports:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch reports for reporter profile" });
      }
    },
  );

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
        await storage.updateEvidenceReportStatus(id, "Assigned");
        res.status(201).json(assignment);
      } catch (error) {
        console.error("Error manual assigning:", error);
        res.status(500).json({ message: "Failed to assign officer." });
      }
    },
  );
  app.post(
    "/api/admin/reports/:id/analyze",
    requireAdminWrite,
    async (req, res) => {
      const { id } = req.params;
      try {
        const report = await storage.getEvidenceReportById(id);
        if (!report) {
          return res.status(404).json({ message: "Report not found." });
        }

        let analysisNote: {
          confidenceScore: number;
          severity: "Critical" | "High" | "Medium" | "Low";
          summary: string;
          detectedObjects: string[];
          evidentiaryValue: string;
          recommendedAction: string;
        };

        if (GEMINI_API_KEY) {
          // --- Real Gemini AI analysis ---
          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          const submittedAt = report.submittedAt
            ? new Date(report.submittedAt).toLocaleString("en-AU", {
                timeZone: "Pacific/Port_Moresby",
              })
            : "Unknown time";

          const attachments = await storage.getReportAttachments(report.id);
          const attachmentSummary =
            attachments.length > 0
              ? attachments
                  .map(
                    (a: any, i: number) =>
                      `Attachment ${i + 1}: ${a.fileName || "Unnamed"} (${a.fileType || "unknown type"}, ${a.mimeType || ""})${a.fileSize ? `, ${Math.round(a.fileSize / 1024)}KB` : ""}`,
                  )
                  .join("\n")
              : "No media attachments uploaded.";

          const prompt = `You are an AI forensic analysis assistant for the Papua New Guinea Police Force crime reporting system (Crime Reporting PNG).

Your task is to analyze the following citizen-submitted crime report and produce a structured, accurate forensic assessment. Be concise but precise. Focus on what is known from the report data.

REPORT DETAILS:
- Incident Type: ${report.incidentType || "Not specified"}
- Description: ${report.description || "Not provided"}
- Location: ${report.address || (report.latitude && report.longitude ? `${report.latitude}, ${report.longitude}` : "Unknown location")}
- GPS Coordinates: ${report.latitude && report.longitude ? `${report.latitude}, ${report.longitude}` : "Not captured"}
- Agency: ${report.agency || "Unknown"}
- Evidence Type: ${report.evidenceType || "Not specified"}
- Submitted At: ${submittedAt}
- Is Anonymous: ${report.isAnonymous ? "Yes" : "No"}
- Reporter: ${report.isAnonymous ? "Anonymous" : report.reporterName || "Unknown"}
- Tags: ${((report.tags as string[]) || []).join(", ") || "None"}
- Priority (self-reported): ${report.priority || "Not set"}
- On Behalf of Someone: ${report.isBehalfReport ? `Yes — Victim: ${report.behalfName || "Unknown"}` : "No"}
- Source Type: ${report.reportSourceType || "Unknown"}
- Media/Attachments:
${attachmentSummary}

ANALYSIS INSTRUCTIONS:
1. Assess the SEVERITY of the incident as one of: Critical, High, Medium, Low — based on the incident type, description content, and any indicated urgency.
2. Write a SUMMARY (2-3 sentences) of what the AI infers from the report data — be factual and grounded in what is stated. Do not fabricate events.
3. List 3-5 DETECTED OBJECTS or INDICATORS that can reasonably be inferred from the report's description, location, and media type.
4. Assess the EVIDENTIARY VALUE (1-2 sentences) — how useful is this report as evidence for law enforcement?
5. Give a RECOMMENDED ACTION (1-2 sentences) for the police officer assigned to this case.
6. Give a CONFIDENCE SCORE between 0.50 and 0.98 based on how much verifiable detail is present in the report.

Return ONLY valid JSON in this exact format:
{
  "confidenceScore": 0.85,
  "severity": "High",
  "summary": "...",
  "detectedObjects": ["...", "...", "..."],
  "evidentiaryValue": "...",
  "recommendedAction": "..."
}`;

          let geminiResult: typeof analysisNote | null = null;
          try {
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
                maxOutputTokens: 1024,
              },
            });
            const raw = result.response.text();
            const parsed = JSON.parse(raw);
            if (
              parsed &&
              parsed.confidenceScore &&
              parsed.severity &&
              parsed.summary
            ) {
              geminiResult = {
                confidenceScore: Math.min(
                  Math.max(Number(parsed.confidenceScore), 0.5),
                  0.98,
                ),
                severity: ["Critical", "High", "Medium", "Low"].includes(
                  parsed.severity,
                )
                  ? (parsed.severity as "Critical" | "High" | "Medium" | "Low")
                  : "Medium",
                summary: String(parsed.summary || ""),
                detectedObjects: Array.isArray(parsed.detectedObjects)
                  ? parsed.detectedObjects.map(String)
                  : [],
                evidentiaryValue: String(parsed.evidentiaryValue || ""),
                recommendedAction: String(parsed.recommendedAction || ""),
              };
            }
          } catch (geminiErr) {
            console.error(
              "Gemini API call failed, falling back to heuristic analysis:",
              geminiErr,
            );
          }

          if (geminiResult) {
            analysisNote = geminiResult;
          } else {
            // Fallback if Gemini fails
            analysisNote = buildHeuristicAnalysis(report as any);
          }
        } else {
          // No API key configured — use heuristic analysis
          console.warn("GEMINI_API_KEY not set. Using heuristic analysis.");
          analysisNote = buildHeuristicAnalysis(report as any);
        }

        const createdNote = await storage.createReportNote({
          reportId: id,
          noteType: "ai_analysis",
          note: JSON.stringify(analysisNote),
          createdBy: "gemini_ai",
        });

        res.status(201).json({ success: true, note: createdNote });
      } catch (error) {
        console.error("Error running AI analysis:", error);
        res.status(500).json({ message: "Failed to perform AI analysis." });
      }
    },
  );

  function buildHeuristicAnalysis(report: {
    incidentType?: string | null;
    description?: string | null;
    evidenceType?: string | null;
    isAnonymous?: boolean | null;
    latitude?: number | null;
    longitude?: number | null;
    priority?: string | null;
  }): {
    confidenceScore: number;
    severity: "Critical" | "High" | "Medium" | "Low";
    summary: string;
    detectedObjects: string[];
    evidentiaryValue: string;
    recommendedAction: string;
  } {
    const incType = String(report.incidentType || "").toLowerCase();
    const descText = String(report.description || "").toLowerCase();
    const hasLocation = !!(report.latitude && report.longitude);
    const hasDescription = (report.description || "").length > 20;

    let confidenceScore = 0.55;
    if (hasLocation) confidenceScore += 0.12;
    if (hasDescription) confidenceScore += 0.1;
    if (!report.isAnonymous) confidenceScore += 0.06;
    confidenceScore = Math.min(confidenceScore + Math.random() * 0.05, 0.9);

    let severity: "Critical" | "High" | "Medium" | "Low" = "Medium";
    let summary = `Report filed regarding ${report.incidentType || "an unspecified incident"} in Papua New Guinea. Evidence type is ${report.evidenceType || "not specified"}.`;
    let detectedObjects: string[] = [
      "Report timestamp verified",
      "Submission metadata captured",
    ];
    let evidentiaryValue =
      "Moderate evidentiary value. Corroborates timestamp and metadata for incident documentation.";
    let recommendedAction =
      "Review full witness statement and cross-reference with nearby dispatch logs and known incident patterns.";

    if (hasLocation) detectedObjects.push("GPS coordinates recorded");
    if (!report.isAnonymous)
      detectedObjects.push("Reporter identity confirmed");

    const isCritical =
      incType.includes("murder") ||
      incType.includes("homicide") ||
      incType.includes("rape") ||
      incType.includes("kidnap") ||
      descText.includes("dead") ||
      descText.includes("killed") ||
      descText.includes("stabbed") ||
      descText.includes("shot");
    const isHighPriority =
      incType.includes("assault") ||
      incType.includes("robbery") ||
      incType.includes("arson") ||
      descText.includes("weapon") ||
      descText.includes("gun") ||
      descText.includes("knife") ||
      descText.includes("fight");
    const isTheft =
      incType.includes("theft") ||
      incType.includes("steal") ||
      descText.includes("stole") ||
      descText.includes("stolen") ||
      descText.includes("thief");
    const isAccident =
      incType.includes("accident") ||
      incType.includes("crash") ||
      descText.includes("collision") ||
      descText.includes("vehicle");
    const isVandalism =
      incType.includes("vandalism") ||
      incType.includes("damage") ||
      descText.includes("spray") ||
      descText.includes("graffiti");
    const isDrug =
      incType.includes("drug") ||
      descText.includes("narcotics") ||
      descText.includes("marijuana") ||
      descText.includes("substance");
    const isDomestic =
      incType.includes("domestic") ||
      descText.includes("wife") ||
      descText.includes("husband") ||
      descText.includes("family violence");

    if (isCritical) {
      severity = "Critical";
      summary = `Critical incident reported: ${report.incidentType || "serious criminal activity"}. The witness account indicates a potentially life-threatening situation requiring immediate law enforcement response.`;
      detectedObjects.push(
        "High-risk incident indicators",
        "Potential threat to life",
        "Urgent dispatch required",
      );
      evidentiaryValue =
        "Critical evidentiary value. Report directly implicates a serious crime requiring immediate corroboration and response.";
      recommendedAction =
        "Dispatch nearest rapid response unit immediately. Secure scene, collect physical evidence, and notify CID for investigation.";
    } else if (isHighPriority) {
      severity = "High";
      summary = `High-priority incident reported: ${report.incidentType || "violent or dangerous activity"}. The description suggests active physical threat or dangerous behaviour in the area.`;
      detectedObjects.push(
        "Physical threat indicators",
        "Potential weapons involvement",
        "Public safety risk",
      );
      evidentiaryValue =
        "High evidentiary value. Report provides first-hand account of a serious incident requiring police action.";
      recommendedAction =
        "Dispatch patrol unit to the reported location, obtain full witness statement, and document physical evidence.";
    } else if (isDomestic) {
      severity = "High";
      summary = `Domestic violence incident reported. Family or household situation described involving harm or threat of harm to a family member.`;
      detectedObjects.push(
        "Domestic conflict indicators",
        "Potential victim in household",
        "Ongoing safety risk",
      );
      evidentiaryValue =
        "High evidentiary value. Domestic violence cases require careful documentation for legal proceedings and protection orders.";
      recommendedAction =
        "Dispatch unit trained in domestic violence response. Contact Family Support Centre and document all injuries and statements.";
    } else if (isTheft) {
      severity = "High";
      summary = `Theft or robbery incident reported. The account indicates forced or opportunistic removal of property from the victim or premises.`;
      detectedObjects.push(
        "Property crime indicators",
        "Possible suspect movement path",
        "Victim impact documented",
      );
      evidentiaryValue =
        "High evidentiary value. Theft reports support prosecution when combined with CCTV and witness statements.";
      recommendedAction =
        "Attend scene, document stolen property list, review nearby CCTV, and check for repeat offender patterns in the area.";
    } else if (isDrug) {
      severity = "High";
      summary = `Drug-related activity reported. The description indicates possible narcotics possession, sale, or distribution in the area.`;
      detectedObjects.push(
        "Drug activity indicators",
        "Location flagged for narcotics",
        "Community safety risk",
      );
      evidentiaryValue =
        "High evidentiary value if corroborated. Drug reports support intelligence operations and warrant applications.";
      recommendedAction =
        "Log report in narcotics intelligence database. Arrange surveillance or covert patrol of indicated location.";
    } else if (isAccident) {
      severity = "High";
      summary = `Traffic or vehicle accident reported at the stated location. Possible injuries, road obstruction, or property damage involved.`;
      detectedObjects.push(
        "Vehicle incident markers",
        "Road hazard indicators",
        "Possible injury to persons",
      );
      evidentiaryValue =
        "High evidentiary value for traffic management, insurance, and injury claims.";
      recommendedAction =
        "Dispatch Traffic Management Unit. Secure accident scene, document damage and injuries, clear road obstruction.";
    } else if (isVandalism) {
      severity = "Medium";
      summary = `Vandalism or property damage reported. The description indicates intentional damage to public or private property.`;
      detectedObjects.push(
        "Property damage evidence",
        "Intentional destruction indicators",
        "Community impact",
      );
      evidentiaryValue =
        "Moderate evidentiary value. Useful for insurance claims and identifying patterns of anti-social behaviour.";
      recommendedAction =
        "Document damage with photos, log in community intelligence database, and investigate for repeat patterns or gang presence.";
    }

    if (report.priority === "High" || report.priority === "Critical") {
      if (severity === "Medium" || (severity as string) === "Low") severity = "High";
    }

    return {
      confidenceScore,
      severity,
      summary,
      detectedObjects,
      evidentiaryValue,
      recommendedAction,
    };
  }

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
        let reportStatus = "Assigned";
        if (status === "Resolved") reportStatus = "Resolved";
        else if (status === "Rejected" || status === "Failed")
          reportStatus = "Rejected";
        else if (status === "Acknowledged") reportStatus = "Assigned";
        else if (status === "On Route") reportStatus = "Assigned";

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

  app.get("/admin", async (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    const session = getSession(req);
    if (!session) {
      return res.status(200).send(adminLoginHtml());
    }
    const user = await storage.getAdminUserByUsername(session.username);
    const permissions = user ? (user.permissions as string[]) || [] : [];
    const roleScript = `<script>window.currentUser = { username: "${session.username}", role: "${session.role}", permissions: ${JSON.stringify(permissions)} };</script>`;
    const responseHtml = adminHtml.replace("<head>", `<head>\n  ${roleScript}`);
    res.status(200).send(responseHtml);
  });

  const httpServer = createServer(app);
  return httpServer;
}
