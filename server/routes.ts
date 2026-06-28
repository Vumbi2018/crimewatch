import type { Express, NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { storage } from "./storage";
import { adminHtml } from "./admin-html";
import { adminStore, distanceKm } from "./admin-store";

const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN || "crimewatch.lamtoninvestments.com";
const ADMIN_COOKIE_NAME = "cpng_admin";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || process.env.CPNG_ADMIN_PASSWORD || "admin123";
const ADMIN_COOKIE_VALUE = createHash("sha256")
  .update(ADMIN_PASSWORD)
  .digest("hex");

const uploadsDir = path.resolve(process.cwd(), "uploads");
const productionReportsCachePath = path.resolve(process.cwd(), "server", "cache", "production-reports.json");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || getExtByMime(file.mimetype);
      cb(null, `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`);
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

function buildReferenceNumber(report: { id: string; submittedAt?: Date | string | null }): string {
  const submittedAt = report.submittedAt ? new Date(report.submittedAt) : new Date();
  const year = Number.isNaN(submittedAt.getTime())
    ? new Date().getUTCFullYear()
    : submittedAt.getUTCFullYear();
  const shortId = report.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CPNG-${year}-${shortId}`;
}

function withReferenceNumber<T extends { id: string; submittedAt?: Date | string | null; fileUrl?: string | null; tags?: unknown }>(report: T) {
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
        const distance = distanceKm(latitude, longitude, station.latitude, station.longitude);
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

function isProductionServer(): boolean {
  return !!(process.env.REPLIT_INTERNAL_APP_DOMAIN || process.env.NODE_ENV === "production");
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
    fs.writeFileSync(productionReportsCachePath, JSON.stringify(reports, null, 2));
    return reports;
  } catch (error) {
    if (fs.existsSync(productionReportsCachePath)) {
      console.warn("Using cached production reports because live fetch failed:", error);
      return JSON.parse(fs.readFileSync(productionReportsCachePath, "utf-8")) as Array<{
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
  const response = await fetch(`https://${PRODUCTION_DOMAIN}/api/reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

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

function isAdminAuthenticated(req: Request): boolean {
  return getCookies(req.headers.cookie)[ADMIN_COOKIE_NAME] === ADMIN_COOKIE_VALUE;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ message: "Admin login required" });
  }
  next();
}

function adminLoginHtml(errorMessage = ""): string {
  const error = errorMessage
    ? `<p class="error">${errorMessage}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crime Prevention PNG - Admin Login</title>
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
    <h1>Crime Prevention PNG</h1>
    <p>Sign in to view and manage submitted reports.</p>
    ${error}
    <label for="password">Admin password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
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

async function forwardFileToProduction(filePath: string, mimeType: string, originalName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append("file", blob, originalName);

    const prodResponse = await fetch(`https://${PRODUCTION_DOMAIN}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (prodResponse.ok) {
      const data = await prodResponse.json() as { fileUrl: string };
      return data.fileUrl;
    }
    console.error("Failed to forward file to production:", prodResponse.status);
    return null;
  } catch (err) {
    console.error("Error forwarding file to production:", err);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/admin/login", (req, res) => {
    if (req.body?.password !== ADMIN_PASSWORD) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(401).send(adminLoginHtml("Incorrect password. Please try again."));
    }

    res.setHeader(
      "Set-Cookie",
      `${ADMIN_COOKIE_NAME}=${encodeURIComponent(ADMIN_COOKIE_VALUE)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
    );
    res.redirect("/admin");
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.setHeader(
      "Set-Cookie",
      `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    );
    res.redirect("/admin");
  });


  app.get("/uploads/:filename", (req, res) => {
    res.redirect(302, `https://${PRODUCTION_DOMAIN}/uploads/${encodeURIComponent(req.params.filename)}`);
  });
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isProduction = isProductionServer();

    if (!isProduction) {
      const prodFileUrl = await forwardFileToProduction(
        req.file.path,
        req.file.mimetype,
        req.file.originalname || `upload${path.extname(req.file.path)}`
      );
      try { fs.unlinkSync(req.file.path); } catch {}
      if (prodFileUrl) {
        return res.json({ fileUrl: prodFileUrl });
      }
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const latitude = req.body?.latitude !== null && req.body?.latitude !== undefined ? Number(req.body.latitude) : NaN;
      const longitude = req.body?.longitude !== null && req.body?.longitude !== undefined ? Number(req.body.longitude) : NaN;
      const nearestStation = Number.isFinite(latitude) && Number.isFinite(longitude)
        ? await findNearestDbPoliceStation(latitude, longitude)
        : null;
      const reportData = {
        ...req.body,
        agency: nearestStation?.name || req.body.agency,
      };
      const report = await storage.createEvidenceReport(reportData);
      forwardToProduction(reportData);
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
            message: "New " + report.priority + " priority " + report.evidenceType + " report near " + nearestStation.name + " (" + nearestStation.distanceKm + " km). Reference: " + buildReferenceNumber(report),
            channel: "console",
            recipient: nearestStation.commandEmail || nearestStation.commandPhone || nearestStation.name,
            status: "sent",
          });
        } catch (notificationError) {
          adminStore.createNotification({
            stationId: nearestStation.id,
            reportId: report.id,
            title: "Immediate crime report dispatch",
            message: "New " + report.priority + " priority " + report.evidenceType + " report near " + nearestStation.name + " (" + nearestStation.distanceKm + " km). Reference: " + buildReferenceNumber(report),
            channel: "console",
            recipient: nearestStation.commandEmail || nearestStation.commandPhone || nearestStation.name,
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
      return res.status(400).json({ message: "Valid latitude and longitude are required" });
    }
    res.json(await findNearestDbPoliceStation(latitude, longitude));
  });

  app.get("/api/admin/location/commands", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listPoliceCommands());
  });

  app.post("/api/admin/location/commands", requireAdmin, async (req, res) => {
    res.status(201).json(await storage.createPoliceCommand(req.body));
  });

  app.get("/api/admin/location/provinces", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listProvinces(req.query.commandId as string | undefined));
  });

  app.post("/api/admin/location/provinces", requireAdmin, async (req, res) => {
    res.status(201).json(await storage.createProvince(req.body));
  });

  app.get("/api/admin/location/districts", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listDistricts(req.query.provinceId as string | undefined));
  });

  app.post("/api/admin/location/districts", requireAdmin, async (req, res) => {
    res.status(201).json(await storage.createDistrict(req.body));
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listAdminUsers());
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    res.status(201).json(await storage.createAdminUser(req.body));
  });

  app.get("/api/admin/police-stations", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listPoliceStations({
      commandId: req.query.commandId as string | undefined,
      provinceId: req.query.provinceId as string | undefined,
      districtId: req.query.districtId as string | undefined,
    }));
  });

  app.post("/api/admin/police-stations", requireAdmin, async (req, res) => {
    res.status(201).json(await storage.createPoliceStation(req.body));
  });

  app.get("/api/admin/deleted-reports", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listDeletedReportAudits());
  });

  app.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listNotificationLogs());
  });

  app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
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
        const productionReport = productionReports.find((item) => item.id === req.params.id);
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


  app.delete("/api/reports/:id", requireAdmin, async (req, res) => {
    try {
      const reason = String(req.body?.reason || "").trim();
      if (reason.length < 8) {
        return res.status(400).json({ message: "Deletion reason must be at least 8 characters." });
      }

      const report = await storage.getEvidenceReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found or cannot be deleted from this environment." });
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

  app.patch("/api/reports/:id/status", requireAdmin, async (req, res) => {
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

  app.get("/admin", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (!isAdminAuthenticated(req)) {
      return res.status(200).send(adminLoginHtml());
    }
    res.status(200).send(adminHtml);
  });

  const httpServer = createServer(app);
  return httpServer;
}
