import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { adminHtml } from "./admin-html";

const PRODUCTION_DOMAIN = "citizen-witness--lanframeit.replit.app";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
