import type { Express } from "express";
import { createServer, type Server } from "node:http";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { storage } from "./storage";
import { adminHtml } from "./admin-html";

const PRODUCTION_DOMAIN = "citizen-witness--lanframeit.replit.app";

const uploadsDir = path.resolve(process.cwd(), "uploads");
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

async function forwardToProduction(reportData: any) {
  try {
    const isProduction = process.env.REPLIT_INTERNAL_APP_DOMAIN || process.env.NODE_ENV === "production";
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
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isProduction = !!(process.env.REPLIT_INTERNAL_APP_DOMAIN || process.env.NODE_ENV === "production");

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
      const report = await storage.createEvidenceReport(req.body);
      forwardToProduction(req.body);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  app.get("/api/reports", async (_req, res) => {
    try {
      const reports = await storage.getAllEvidenceReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getEvidenceReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.patch("/api/reports/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateEvidenceReportStatus(req.params.id, status);
      res.json({ message: "Status updated" });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/admin", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(adminHtml);
  });

  const httpServer = createServer(app);
  return httpServer;
}
