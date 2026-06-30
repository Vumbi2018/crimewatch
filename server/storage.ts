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
  type OfficerProfile,
  type ReportAssignment,
  type ReportNote,
  type InsertOfficerProfile,
  type InsertReportAssignment,
  type InsertReportNote,
  evidenceReports,
  policeCommands,
  provinces,
  districts,
  policeStations,
  adminUsers,
  notificationLogs,
  reportDispatches,
  deletedReportAudits,
  officerProfiles,
  reportAssignments,
  reportNotes,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { asc, desc, eq, and } from "drizzle-orm";

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
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  listNotificationLogs(): Promise<NotificationLog[]>;
  createNotificationLog(notification: InsertNotificationLog): Promise<NotificationLog>;
  createReportDispatch(dispatch: InsertReportDispatch): Promise<ReportDispatch>;
  listOfficerProfiles(): Promise<OfficerProfile[]>;
  getOfficerProfileByUserId(userId: string): Promise<OfficerProfile | undefined>;
  createOfficerProfile(profile: InsertOfficerProfile): Promise<OfficerProfile>;
  listReportAssignments(filters?: { officerUserId?: string; reportId?: string }): Promise<ReportAssignment[]>;
  createReportAssignment(assignment: InsertReportAssignment): Promise<ReportAssignment>;
  updateReportAssignmentStatus(id: string, status: string): Promise<void>;
  listReportNotes(reportId: string): Promise<ReportNote[]>;
  createReportNote(note: InsertReportNote): Promise<ReportNote>;
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
    const [created] = await db
      .insert(policeCommands)
      .values(command)
      .onConflictDoUpdate({
        target: policeCommands.code,
        set: command,
      })
      .returning();
    return created;
  }

  async listProvinces(commandId?: string): Promise<Province[]> {
    const query = db.select().from(provinces);
    if (commandId) return query.where(eq(provinces.commandId, commandId)).orderBy(asc(provinces.name));
    return query.orderBy(asc(provinces.name));
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    const [created] = await db
      .insert(provinces)
      .values(province)
      .onConflictDoUpdate({
        target: provinces.code,
        set: province,
      })
      .returning();
    return created;
  }

  async listDistricts(provinceId?: string): Promise<District[]> {
    const query = db.select().from(districts);
    if (provinceId) return query.where(eq(districts.provinceId, provinceId)).orderBy(asc(districts.name));
    return query.orderBy(asc(districts.name));
  }

  async createDistrict(district: InsertDistrict): Promise<District> {
    const [created] = await db
      .insert(districts)
      .values(district)
      .onConflictDoUpdate({
        target: districts.code,
        set: district,
      })
      .returning();
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
    if (station.code) {
      const [existing] = await db.select().from(policeStations).where(eq(policeStations.code, station.code));
      if (existing) {
        const [updated] = await db
          .update(policeStations)
          .set(station)
          .where(eq(policeStations.id, existing.id))
          .returning();
        return updated;
      }
    }

    const [created] = await db.insert(policeStations).values(station).returning();
    return created;
  }

  async listAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(asc(adminUsers.name));
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db
      .insert(adminUsers)
      .values(user)
      .onConflictDoUpdate({
        target: adminUsers.username,
        set: user,
      })
      .returning();
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

  async listOfficerProfiles(): Promise<OfficerProfile[]> {
    return db.select().from(officerProfiles).orderBy(desc(officerProfiles.createdAt));
  }

  async getOfficerProfileByUserId(userId: string): Promise<OfficerProfile | undefined> {
    const [profile] = await db.select().from(officerProfiles).where(eq(officerProfiles.userId, userId));
    return profile;
  }

  async createOfficerProfile(profile: InsertOfficerProfile): Promise<OfficerProfile> {
    const [created] = await db.insert(officerProfiles).values(profile).returning();
    return created;
  }

  async listReportAssignments(filters: { officerUserId?: string; reportId?: string } = {}): Promise<ReportAssignment[]> {
    const query = db.select().from(reportAssignments);
    if (filters.officerUserId && filters.reportId) {
      return query.where(and(eq(reportAssignments.officerUserId, filters.officerUserId), eq(reportAssignments.reportId, filters.reportId))).orderBy(desc(reportAssignments.createdAt));
    }
    if (filters.officerUserId) {
      return query.where(eq(reportAssignments.officerUserId, filters.officerUserId)).orderBy(desc(reportAssignments.createdAt));
    }
    if (filters.reportId) {
      return query.where(eq(reportAssignments.reportId, filters.reportId)).orderBy(desc(reportAssignments.createdAt));
    }
    return query.orderBy(desc(reportAssignments.createdAt));
  }

  async createReportAssignment(assignment: InsertReportAssignment): Promise<ReportAssignment> {
    const [created] = await db.insert(reportAssignments).values(assignment).returning();
    return created;
  }

  async updateReportAssignmentStatus(id: string, status: string): Promise<void> {
    await db.update(reportAssignments).set({ status, updatedAt: new Date() }).where(eq(reportAssignments.id, id));
  }

  async listReportNotes(reportId: string): Promise<ReportNote[]> {
    return db.select().from(reportNotes).where(eq(reportNotes.reportId, reportId)).orderBy(desc(reportNotes.createdAt));
  }

  async createReportNote(note: InsertReportNote): Promise<ReportNote> {
    const [created] = await db.insert(reportNotes).values(note).returning();
    return created;
  }
}


export const storage = new DatabaseStorage();
