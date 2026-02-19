import { type User, type InsertUser, type EvidenceReport, type InsertEvidenceReport, evidenceReports } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createEvidenceReport(report: InsertEvidenceReport): Promise<EvidenceReport>;
  getAllEvidenceReports(): Promise<EvidenceReport[]>;
  getEvidenceReportById(id: string): Promise<EvidenceReport | undefined>;
  updateEvidenceReportStatus(id: string, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    return user;
  }

  async createEvidenceReport(report: InsertEvidenceReport): Promise<EvidenceReport> {
    const [created] = await db.insert(evidenceReports).values(report).returning();
    return created;
  }

  async getAllEvidenceReports(): Promise<EvidenceReport[]> {
    return db.select().from(evidenceReports).orderBy(desc(evidenceReports.submittedAt));
  }

  async getEvidenceReportById(id: string): Promise<EvidenceReport | undefined> {
    const [report] = await db.select().from(evidenceReports).where(eq(evidenceReports.id, id));
    return report;
  }

  async updateEvidenceReportStatus(id: string, status: string): Promise<void> {
    await db.update(evidenceReports).set({ status }).where(eq(evidenceReports.id, id));
  }
}

export const storage = new DatabaseStorage();
