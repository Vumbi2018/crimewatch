import {
  type User,
  type InsertUser,
  type EvidenceReport,
  type InsertEvidenceReport,
  type PoliceCommand,
  type Province,
  type District,
  type PoliceStation,
  type AdminUser,
  type NotificationLog,
  type ReportDispatch,
  type DeletedReportAudit,
  type InsertPoliceCommand,
  type InsertProvince,
  type InsertDistrict,
  type InsertPoliceStation,
  type InsertAdminUser,
  type InsertNotificationLog,
  type InsertReportDispatch,
  type InsertDeletedReportAudit,
  evidenceReports,
  policeCommands,
  provinces,
  districts,
  policeStations,
  adminUsers,
  notificationLogs,
  reportDispatches,
  deletedReportAudits,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { asc, desc, eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createEvidenceReport(report: InsertEvidenceReport): Promise<EvidenceReport>;
  getAllEvidenceReports(): Promise<EvidenceReport[]>;
  getEvidenceReportById(id: string): Promise<EvidenceReport | undefined>;
  updateEvidenceReportStatus(id: string, status: string): Promise<void>;
  deleteEvidenceReportWithAudit(id: string, audit: Omit<InsertDeletedReportAudit, "reportId" | "reportSnapshot">): Promise<DeletedReportAudit | undefined>;
  listDeletedReportAudits(): Promise<DeletedReportAudit[]>;
  listPoliceCommands(): Promise<PoliceCommand[]>;
  createPoliceCommand(command: InsertPoliceCommand): Promise<PoliceCommand>;
  listProvinces(commandId?: string): Promise<Province[]>;
  createProvince(province: InsertProvince): Promise<Province>;
  listDistricts(provinceId?: string): Promise<District[]>;
  createDistrict(district: InsertDistrict): Promise<District>;
  listPoliceStations(filters?: { commandId?: string; provinceId?: string; districtId?: string; activeOnly?: boolean }): Promise<PoliceStation[]>;
  createPoliceStation(station: InsertPoliceStation): Promise<PoliceStation>;
  listAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  listNotificationLogs(): Promise<NotificationLog[]>;
  createNotificationLog(notification: InsertNotificationLog): Promise<NotificationLog>;
  createReportDispatch(dispatch: InsertReportDispatch): Promise<ReportDispatch>;
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

  async deleteEvidenceReportWithAudit(
    id: string,
    audit: Omit<InsertDeletedReportAudit, "reportId" | "reportSnapshot">,
  ): Promise<DeletedReportAudit | undefined> {
    const report = await this.getEvidenceReportById(id);
    if (!report) return undefined;

    const [createdAudit] = await db
      .insert(deletedReportAudits)
      .values({
        ...audit,
        reportId: id,
        reportSnapshot: report,
      })
      .returning();

    await db.delete(evidenceReports).where(eq(evidenceReports.id, id));
    return createdAudit;
  }

  async listDeletedReportAudits(): Promise<DeletedReportAudit[]> {
    return db.select().from(deletedReportAudits).orderBy(desc(deletedReportAudits.deletedAt));
  }

  async listPoliceCommands(): Promise<PoliceCommand[]> {
    return db.select().from(policeCommands).orderBy(asc(policeCommands.name));
  }

  async createPoliceCommand(command: InsertPoliceCommand): Promise<PoliceCommand> {
    const [created] = await db.insert(policeCommands).values(command).returning();
    return created;
  }

  async listProvinces(commandId?: string): Promise<Province[]> {
    const query = db.select().from(provinces);
    if (commandId) return query.where(eq(provinces.commandId, commandId)).orderBy(asc(provinces.name));
    return query.orderBy(asc(provinces.name));
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    const [created] = await db.insert(provinces).values(province).returning();
    return created;
  }

  async listDistricts(provinceId?: string): Promise<District[]> {
    const query = db.select().from(districts);
    if (provinceId) return query.where(eq(districts.provinceId, provinceId)).orderBy(asc(districts.name));
    return query.orderBy(asc(districts.name));
  }

  async createDistrict(district: InsertDistrict): Promise<District> {
    const [created] = await db.insert(districts).values(district).returning();
    return created;
  }

  async listPoliceStations(filters: { commandId?: string; provinceId?: string; districtId?: string; activeOnly?: boolean } = {}): Promise<PoliceStation[]> {
    let results = await db.select().from(policeStations).orderBy(asc(policeStations.name));
    if (filters.commandId) results = results.filter((station: PoliceStation) => station.commandId === filters.commandId);
    if (filters.provinceId) results = results.filter((station: PoliceStation) => station.provinceId === filters.provinceId);
    if (filters.districtId) results = results.filter((station: PoliceStation) => station.districtId === filters.districtId);
    if (filters.activeOnly) results = results.filter((station: PoliceStation) => station.isActive);
    return results;
  }

  async createPoliceStation(station: InsertPoliceStation): Promise<PoliceStation> {
    const [created] = await db.insert(policeStations).values(station).returning();
    return created;
  }

  async listAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(asc(adminUsers.name));
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values(user).returning();
    return created;
  }

  async listNotificationLogs(): Promise<NotificationLog[]> {
    return db.select().from(notificationLogs).orderBy(desc(notificationLogs.createdAt));
  }

  async createNotificationLog(notification: InsertNotificationLog): Promise<NotificationLog> {
    const [created] = await db.insert(notificationLogs).values(notification).returning();
    return created;
  }

  async createReportDispatch(dispatch: InsertReportDispatch): Promise<ReportDispatch> {
    const [created] = await db.insert(reportDispatches).values(dispatch).returning();
    return created;
  }
}


export const storage = new DatabaseStorage();
