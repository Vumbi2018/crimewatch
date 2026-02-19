import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import * as fs from "fs";
import * as path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/reports", async (req, res) => {
    try {
      const report = await storage.createEvidenceReport(req.body);
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
    const adminPath = path.resolve(process.cwd(), "server", "templates", "admin.html");
    if (fs.existsSync(adminPath)) {
      res.sendFile(adminPath);
    } else {
      res.status(404).send("Admin portal not found");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
