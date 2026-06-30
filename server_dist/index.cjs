"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.ts
var import_express = __toESM(require("express"));

// server/routes.ts
var import_node_crypto = require("node:crypto");
var import_node_http = require("node:http");
var import_multer = __toESM(require("multer"));
var path2 = __toESM(require("path"));
var fs2 = __toESM(require("fs"));

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  deletedReportAudits: () => deletedReportAudits,
  districts: () => districts,
  evidenceReports: () => evidenceReports,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertDeletedReportAuditSchema: () => insertDeletedReportAuditSchema,
  insertDistrictSchema: () => insertDistrictSchema,
  insertEvidenceReportSchema: () => insertEvidenceReportSchema,
  insertNotificationLogSchema: () => insertNotificationLogSchema,
  insertOfficerProfileSchema: () => insertOfficerProfileSchema,
  insertPoliceCommandSchema: () => insertPoliceCommandSchema,
  insertPoliceStationSchema: () => insertPoliceStationSchema,
  insertProvinceSchema: () => insertProvinceSchema,
  insertReportAssignmentSchema: () => insertReportAssignmentSchema,
  insertReportDispatchSchema: () => insertReportDispatchSchema,
  insertReportNoteSchema: () => insertReportNoteSchema,
  insertUserSchema: () => insertUserSchema,
  notificationLogs: () => notificationLogs,
  officerProfiles: () => officerProfiles,
  policeCommands: () => policeCommands,
  policeStations: () => policeStations,
  provinces: () => provinces,
  reportAssignments: () => reportAssignments,
  reportDispatches: () => reportDispatches,
  reportNotes: () => reportNotes,
  users: () => users
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_zod = require("drizzle-zod");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  username: (0, import_pg_core.text)("username").notNull().unique(),
  password: (0, import_pg_core.text)("password").notNull()
});
var evidenceReports = (0, import_pg_core.pgTable)("evidence_reports", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  evidenceType: (0, import_pg_core.text)("evidence_type").notNull(),
  incidentType: (0, import_pg_core.text)("incident_type"),
  description: (0, import_pg_core.text)("description"),
  latitude: (0, import_pg_core.text)("latitude"),
  longitude: (0, import_pg_core.text)("longitude"),
  address: (0, import_pg_core.text)("address"),
  tags: (0, import_pg_core.jsonb)("tags").$type().default([]),
  agency: (0, import_pg_core.text)("agency").notNull(),
  priority: (0, import_pg_core.text)("priority").notNull().default("Medium"),
  isAnonymous: (0, import_pg_core.integer)("is_anonymous").notNull().default(0),
  contactPhone: (0, import_pg_core.text)("contact_phone"),
  contactEmail: (0, import_pg_core.text)("contact_email"),
  reporterName: (0, import_pg_core.text)("reporter_name"),
  status: (0, import_pg_core.text)("status").notNull().default("New"),
  fileUrl: (0, import_pg_core.text)("file_url"),
  assignedStationId: (0, import_pg_core.varchar)("assigned_station_id"),
  isBehalfReport: (0, import_pg_core.boolean)("is_behalf_report").notNull().default(false),
  behalfName: (0, import_pg_core.text)("behalf_name"),
  behalfContact: (0, import_pg_core.text)("behalf_contact"),
  behalfRelationship: (0, import_pg_core.text)("behalf_relationship"),
  behalfConsent: (0, import_pg_core.boolean)("behalf_consent").notNull().default(false),
  behalfSource: (0, import_pg_core.text)("behalf_source"),
  attachments: (0, import_pg_core.jsonb)("attachments").$type().default([]),
  submittedAt: (0, import_pg_core.timestamp)("submitted_at").defaultNow().notNull()
});
var policeCommands = (0, import_pg_core.pgTable)("police_commands", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  name: (0, import_pg_core.text)("name").notNull(),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  headquarters: (0, import_pg_core.text)("headquarters"),
  phone: (0, import_pg_core.text)("phone"),
  email: (0, import_pg_core.text)("email"),
  commanderName: (0, import_pg_core.text)("commander_name"),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var provinces = (0, import_pg_core.pgTable)("provinces", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  commandId: (0, import_pg_core.varchar)("command_id").notNull(),
  name: (0, import_pg_core.text)("name").notNull(),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  capital: (0, import_pg_core.text)("capital"),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var districts = (0, import_pg_core.pgTable)("districts", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  provinceId: (0, import_pg_core.varchar)("province_id").notNull(),
  name: (0, import_pg_core.text)("name").notNull(),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var policeStations = (0, import_pg_core.pgTable)("police_stations", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  commandId: (0, import_pg_core.varchar)("command_id").notNull(),
  provinceId: (0, import_pg_core.varchar)("province_id").notNull(),
  districtId: (0, import_pg_core.varchar)("district_id").notNull(),
  name: (0, import_pg_core.text)("name").notNull(),
  code: (0, import_pg_core.text)("code"),
  stationType: (0, import_pg_core.text)("station_type").notNull().default("station"),
  address: (0, import_pg_core.text)("address"),
  latitude: (0, import_pg_core.real)("latitude").notNull(),
  longitude: (0, import_pg_core.real)("longitude").notNull(),
  commandPhone: (0, import_pg_core.text)("command_phone"),
  commandEmail: (0, import_pg_core.text)("command_email"),
  commanderName: (0, import_pg_core.text)("commander_name"),
  operatingHours: (0, import_pg_core.text)("operating_hours").notNull().default("24/7"),
  responseRadiusKm: (0, import_pg_core.real)("response_radius_km").notNull().default(20),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  notes: (0, import_pg_core.text)("notes"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var adminUsers = (0, import_pg_core.pgTable)("admin_users", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  name: (0, import_pg_core.text)("name").notNull(),
  username: (0, import_pg_core.text)("username").notNull().unique(),
  passwordHash: (0, import_pg_core.text)("password_hash"),
  role: (0, import_pg_core.text)("role").notNull().default("viewer"),
  commandId: (0, import_pg_core.varchar)("command_id"),
  provinceId: (0, import_pg_core.varchar)("province_id"),
  districtId: (0, import_pg_core.varchar)("district_id"),
  stationId: (0, import_pg_core.varchar)("station_id"),
  phone: (0, import_pg_core.text)("phone"),
  email: (0, import_pg_core.text)("email"),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var notificationLogs = (0, import_pg_core.pgTable)("notification_logs", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  stationId: (0, import_pg_core.varchar)("station_id"),
  reportId: (0, import_pg_core.varchar)("report_id"),
  userId: (0, import_pg_core.varchar)("user_id"),
  title: (0, import_pg_core.text)("title").notNull(),
  message: (0, import_pg_core.text)("message").notNull(),
  channel: (0, import_pg_core.text)("channel").notNull().default("console"),
  recipient: (0, import_pg_core.text)("recipient").notNull(),
  status: (0, import_pg_core.text)("status").notNull().default("queued"),
  providerMessageId: (0, import_pg_core.text)("provider_message_id"),
  errorMessage: (0, import_pg_core.text)("error_message"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var reportDispatches = (0, import_pg_core.pgTable)("report_dispatches", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  reportId: (0, import_pg_core.varchar)("report_id").notNull(),
  stationId: (0, import_pg_core.varchar)("station_id").notNull(),
  distanceKm: (0, import_pg_core.real)("distance_km"),
  withinResponseRadius: (0, import_pg_core.boolean)("within_response_radius").notNull().default(false),
  status: (0, import_pg_core.text)("status").notNull().default("notified"),
  notifiedAt: (0, import_pg_core.timestamp)("notified_at").defaultNow().notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var deletedReportAudits = (0, import_pg_core.pgTable)("deleted_report_audits", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  reportId: (0, import_pg_core.varchar)("report_id").notNull(),
  referenceNumber: (0, import_pg_core.text)("reference_number"),
  reason: (0, import_pg_core.text)("reason").notNull(),
  deletedBy: (0, import_pg_core.text)("deleted_by").notNull().default("admin"),
  reportSnapshot: (0, import_pg_core.jsonb)("report_snapshot").$type().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at").defaultNow().notNull()
});
var officerProfiles = (0, import_pg_core.pgTable)("officer_profiles", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").notNull(),
  rank: (0, import_pg_core.text)("rank").notNull(),
  stationId: (0, import_pg_core.varchar)("station_id"),
  responsibilityAreaName: (0, import_pg_core.text)("responsibility_area_name").notNull(),
  latitude: (0, import_pg_core.real)("latitude").notNull(),
  longitude: (0, import_pg_core.real)("longitude").notNull(),
  radiusKm: (0, import_pg_core.real)("radius_km").notNull().default(10),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var reportAssignments = (0, import_pg_core.pgTable)("report_assignments", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  reportId: (0, import_pg_core.varchar)("report_id").notNull(),
  officerUserId: (0, import_pg_core.varchar)("officer_user_id").notNull(),
  assignmentType: (0, import_pg_core.text)("assignment_type").notNull().default("automatic"),
  assignmentReason: (0, import_pg_core.text)("assignment_reason"),
  matchedAreaName: (0, import_pg_core.text)("matched_area_name"),
  status: (0, import_pg_core.text)("status").notNull().default("Sent to Officer"),
  sentAt: (0, import_pg_core.timestamp)("sent_at").defaultNow().notNull(),
  acknowledgedAt: (0, import_pg_core.timestamp)("acknowledged_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var reportNotes = (0, import_pg_core.pgTable)("report_notes", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  reportId: (0, import_pg_core.varchar)("report_id").notNull(),
  noteType: (0, import_pg_core.text)("note_type").notNull().default("general"),
  note: (0, import_pg_core.text)("note").notNull(),
  createdBy: (0, import_pg_core.text)("created_by").notNull().default("system"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(users).pick({
  username: true,
  password: true
});
var insertEvidenceReportSchema = (0, import_drizzle_zod.createInsertSchema)(evidenceReports).omit({
  id: true,
  submittedAt: true
});
var insertPoliceCommandSchema = (0, import_drizzle_zod.createInsertSchema)(policeCommands).omit({ id: true, createdAt: true });
var insertProvinceSchema = (0, import_drizzle_zod.createInsertSchema)(provinces).omit({ id: true, createdAt: true });
var insertDistrictSchema = (0, import_drizzle_zod.createInsertSchema)(districts).omit({ id: true, createdAt: true });
var insertPoliceStationSchema = (0, import_drizzle_zod.createInsertSchema)(policeStations).omit({ id: true, createdAt: true });
var insertAdminUserSchema = (0, import_drizzle_zod.createInsertSchema)(adminUsers).omit({ id: true, createdAt: true });
var insertNotificationLogSchema = (0, import_drizzle_zod.createInsertSchema)(notificationLogs).omit({ id: true, createdAt: true });
var insertReportDispatchSchema = (0, import_drizzle_zod.createInsertSchema)(reportDispatches).omit({ id: true, createdAt: true });
var insertDeletedReportAuditSchema = (0, import_drizzle_zod.createInsertSchema)(deletedReportAudits).omit({ id: true, deletedAt: true });
var insertOfficerProfileSchema = (0, import_drizzle_zod.createInsertSchema)(officerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
var insertReportAssignmentSchema = (0, import_drizzle_zod.createInsertSchema)(reportAssignments).omit({ id: true, createdAt: true, updatedAt: true });
var insertReportNoteSchema = (0, import_drizzle_zod.createInsertSchema)(reportNotes).omit({ id: true, createdAt: true });

// server/storage.ts
var import_crypto = require("crypto");

// server/db.ts
var import_dotenv = require("dotenv");
var import_neon_serverless = require("drizzle-orm/neon-serverless");
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_ws = __toESM(require("ws"));
(0, import_dotenv.config)();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
var databaseUrl = process.env.DATABASE_URL;
var isLocalPostgres = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") || databaseUrl.includes("host.docker.internal");
var db;
if (isLocalPostgres) {
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: databaseUrl });
  console.log("Using node-postgres database driver for local DATABASE_URL");
  db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
} else {
  console.log("Using Neon serverless database driver");
  db = (0, import_neon_serverless.drizzle)({
    connection: databaseUrl,
    schema: schema_exports,
    ws: import_ws.default
  });
}

// server/storage.ts
var import_drizzle_orm2 = require("drizzle-orm");
var DatabaseStorage = class {
  async getUser(id) {
    return void 0;
  }
  async getUserByUsername(username) {
    return void 0;
  }
  async createUser(insertUser) {
    const id = (0, import_crypto.randomUUID)();
    const user = { ...insertUser, id };
    return user;
  }
  async createEvidenceReport(report) {
    const [created] = await db.insert(evidenceReports).values(report).returning();
    return created;
  }
  async getAllEvidenceReports() {
    return db.select().from(evidenceReports).orderBy((0, import_drizzle_orm2.desc)(evidenceReports.submittedAt));
  }
  async getEvidenceReportById(id) {
    const [report] = await db.select().from(evidenceReports).where((0, import_drizzle_orm2.eq)(evidenceReports.id, id));
    return report;
  }
  async updateEvidenceReportStatus(id, status) {
    await db.update(evidenceReports).set({ status }).where((0, import_drizzle_orm2.eq)(evidenceReports.id, id));
  }
  async deleteEvidenceReportWithAudit(id, audit) {
    const report = await this.getEvidenceReportById(id);
    if (!report) return void 0;
    const [createdAudit] = await db.insert(deletedReportAudits).values({
      ...audit,
      reportId: id,
      reportSnapshot: report
    }).returning();
    await db.delete(evidenceReports).where((0, import_drizzle_orm2.eq)(evidenceReports.id, id));
    return createdAudit;
  }
  async listDeletedReportAudits() {
    return db.select().from(deletedReportAudits).orderBy((0, import_drizzle_orm2.desc)(deletedReportAudits.deletedAt));
  }
  async listPoliceCommands() {
    return db.select().from(policeCommands).orderBy((0, import_drizzle_orm2.asc)(policeCommands.name));
  }
  async createPoliceCommand(command) {
    const [created] = await db.insert(policeCommands).values(command).onConflictDoUpdate({
      target: policeCommands.code,
      set: command
    }).returning();
    return created;
  }
  async listProvinces(commandId) {
    const query = db.select().from(provinces);
    if (commandId) return query.where((0, import_drizzle_orm2.eq)(provinces.commandId, commandId)).orderBy((0, import_drizzle_orm2.asc)(provinces.name));
    return query.orderBy((0, import_drizzle_orm2.asc)(provinces.name));
  }
  async createProvince(province) {
    const [created] = await db.insert(provinces).values(province).onConflictDoUpdate({
      target: provinces.code,
      set: province
    }).returning();
    return created;
  }
  async listDistricts(provinceId) {
    const query = db.select().from(districts);
    if (provinceId) return query.where((0, import_drizzle_orm2.eq)(districts.provinceId, provinceId)).orderBy((0, import_drizzle_orm2.asc)(districts.name));
    return query.orderBy((0, import_drizzle_orm2.asc)(districts.name));
  }
  async createDistrict(district) {
    const [created] = await db.insert(districts).values(district).onConflictDoUpdate({
      target: districts.code,
      set: district
    }).returning();
    return created;
  }
  async listPoliceStations(filters = {}) {
    let results = await db.select().from(policeStations).orderBy((0, import_drizzle_orm2.asc)(policeStations.name));
    if (filters.commandId) results = results.filter((station) => station.commandId === filters.commandId);
    if (filters.provinceId) results = results.filter((station) => station.provinceId === filters.provinceId);
    if (filters.districtId) results = results.filter((station) => station.districtId === filters.districtId);
    if (filters.activeOnly) results = results.filter((station) => station.isActive);
    return results;
  }
  async createPoliceStation(station) {
    if (station.code) {
      const [existing] = await db.select().from(policeStations).where((0, import_drizzle_orm2.eq)(policeStations.code, station.code));
      if (existing) {
        const [updated] = await db.update(policeStations).set(station).where((0, import_drizzle_orm2.eq)(policeStations.id, existing.id)).returning();
        return updated;
      }
    }
    const [created] = await db.insert(policeStations).values(station).returning();
    return created;
  }
  async listAdminUsers() {
    return db.select().from(adminUsers).orderBy((0, import_drizzle_orm2.asc)(adminUsers.name));
  }
  async getAdminUserByUsername(username) {
    const [user] = await db.select().from(adminUsers).where((0, import_drizzle_orm2.eq)(adminUsers.username, username));
    return user;
  }
  async createAdminUser(user) {
    const [created] = await db.insert(adminUsers).values(user).onConflictDoUpdate({
      target: adminUsers.username,
      set: user
    }).returning();
    return created;
  }
  async listNotificationLogs() {
    return db.select().from(notificationLogs).orderBy((0, import_drizzle_orm2.desc)(notificationLogs.createdAt));
  }
  async createNotificationLog(notification) {
    const [created] = await db.insert(notificationLogs).values(notification).returning();
    return created;
  }
  async createReportDispatch(dispatch) {
    const [created] = await db.insert(reportDispatches).values(dispatch).returning();
    return created;
  }
  async listOfficerProfiles() {
    return db.select().from(officerProfiles).orderBy((0, import_drizzle_orm2.desc)(officerProfiles.createdAt));
  }
  async getOfficerProfileByUserId(userId) {
    const [profile] = await db.select().from(officerProfiles).where((0, import_drizzle_orm2.eq)(officerProfiles.userId, userId));
    return profile;
  }
  async createOfficerProfile(profile) {
    const [created] = await db.insert(officerProfiles).values(profile).returning();
    return created;
  }
  async listReportAssignments(filters = {}) {
    const query = db.select().from(reportAssignments);
    if (filters.officerUserId && filters.reportId) {
      return query.where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(reportAssignments.officerUserId, filters.officerUserId), (0, import_drizzle_orm2.eq)(reportAssignments.reportId, filters.reportId))).orderBy((0, import_drizzle_orm2.desc)(reportAssignments.createdAt));
    }
    if (filters.officerUserId) {
      return query.where((0, import_drizzle_orm2.eq)(reportAssignments.officerUserId, filters.officerUserId)).orderBy((0, import_drizzle_orm2.desc)(reportAssignments.createdAt));
    }
    if (filters.reportId) {
      return query.where((0, import_drizzle_orm2.eq)(reportAssignments.reportId, filters.reportId)).orderBy((0, import_drizzle_orm2.desc)(reportAssignments.createdAt));
    }
    return query.orderBy((0, import_drizzle_orm2.desc)(reportAssignments.createdAt));
  }
  async createReportAssignment(assignment) {
    const [created] = await db.insert(reportAssignments).values(assignment).returning();
    return created;
  }
  async updateReportAssignmentStatus(id, status) {
    await db.update(reportAssignments).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(reportAssignments.id, id));
  }
  async listReportNotes(reportId) {
    return db.select().from(reportNotes).where((0, import_drizzle_orm2.eq)(reportNotes.reportId, reportId)).orderBy((0, import_drizzle_orm2.desc)(reportNotes.createdAt));
  }
  async createReportNote(note) {
    const [created] = await db.insert(reportNotes).values(note).returning();
    return created;
  }
};
var storage = new DatabaseStorage();

// server/admin-html.ts
var adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crime Reporting PNG - Admin Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIINfQPDu7w6ZZO1+ga8jF3N9t7lTfIufhk=" crossorigin="">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      --bg-root: #0f1724;
      --bg-sidebar: #0b1220;
      --bg-card: #1a2744;
      --bg-card-strong: #0f1724;
      --border: #2d3a4f;
      --border-soft: #1e293b;
      --text: #e2e8f0;
      --text-strong: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #1d4ed8;
      --control-bg: rgba(15, 23, 36, 0.98);
      --control-border: #334155;
      --control-text: #e2e8f0;
      --control-muted: #94a3b8;
      --sidebar-text: #cbd5e1;
      --sidebar-hover: #111c31;
      --surface-shadow: none;
      --map-empty-bg: rgba(15, 23, 36, 0.88);
      --link: #60a5fa;
      --reference: #bfdbfe;
      font-family: 'Ubuntu', 'Segoe UI', Arial, sans-serif;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.5;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: var(--bg-root);
      color: var(--text);
      min-height: 100vh;
    }
    body.light-theme {
      --bg-root: #eef3f8;
      --bg-sidebar: #ffffff;
      --bg-card: #ffffff;
      --bg-card-strong: #f8fafc;
      --border: #c4d0df;
      --border-soft: #d7e0ec;
      --text: #172033;
      --text-strong: #0f172a;
      --text-muted: #475569;
      --primary: #1d4ed8;
      --control-bg: #ffffff;
      --control-border: #cbd8e6;
      --control-text: #1e293b;
      --control-muted: #5f6f82;
      --sidebar-text: #26384f;
      --sidebar-hover: #e6eef8;
      --surface-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
      --map-empty-bg: rgba(244, 247, 251, 0.88);
      --link: #1d4ed8;
      --reference: #1e40af;
    }
    .header {
      background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-root) 100%);
      border-bottom: 1px solid var(--border);
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-actions { display:flex; align-items:center; gap:12px; }
    .theme-toggle label { color:var(--text-muted); font-size:13px; font-weight:700; }
    body.light-theme .header { background: #ffffff; box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06); }
    body.light-theme .sidebar { box-shadow: 1px 0 0 rgba(15, 23, 42, 0.04); }
    body.light-theme .map-controls { box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04); }
    body.light-theme .map-summary { scrollbar-color: #cbd8e6 transparent; }
    body.light-theme .logout-btn { background:#f8fafc; color:#52647a; border-color:#cbd8e6; }
    body.light-theme .logout-btn:hover { color:#1e293b; border-color:#94a3b8; background:#eef4fb; }
    body.light-theme th { background:#f8fafc; color:#52647a; }
    body.light-theme tr:hover { background:#f1f6fd; }
    body.light-theme .sidebar-label { color:#53657a; }
    body.light-theme .theme-select,
    body.light-theme .report-filter-input,
    body.light-theme .report-filter-select,
    body.light-theme .map-select,
    body.light-theme .map-search,
    body.light-theme .admin-input,
    body.light-theme .admin-select,
    body.light-theme .admin-textarea,
    body.light-theme .status-select {
      background: #ffffff;
      color: #0f172a;
      border-color: #b7c6d8;
    }
    body.light-theme input::placeholder,
    body.light-theme textarea::placeholder { color: #64748b; opacity: 1; }
    body.light-theme .map-controls { background:#f8fafc; border-color:#cbd8e6; }
    body.light-theme .map-toggle,
    body.light-theme .map-control-btn.secondary {
      background:#ffffff;
      color:#1e293b;
      border-color:#b7c6d8;
    }
    body.light-theme .map-help,
    body.light-theme .map-list-meta,
    body.light-theme .map-legend { color:#475569; }
    body.light-theme .map-list-item { background:#ffffff; border-color:#cbd8e6; color:#0f172a; }
    body.light-theme .map-list-item:hover { background:#f1f6fd; border-color:#2563eb; }
    body.light-theme .map-metric { background:#f8fafc; border-color:#cbd8e6; }
    body.light-theme td { color:#1e293b; }
    body.light-theme .reference-cell,
    body.light-theme .reference-text { color:#1e40af; }
    body.light-theme .location-link,
    body.light-theme .file-dot { color:#1d4ed8; }
    body.light-theme .reporter-info { color:#475569; }
    body.light-theme .empty-state { color:#64748b; }
    body.light-theme .detail-modal { background: rgba(15, 23, 42, 0.42); }
    body.light-theme .leaflet-popup-content-wrapper,
    body.light-theme .leaflet-popup-tip { background:#ffffff; color:#0f172a; border-color:#cbd8e6; }
    body.light-theme .badge-photo { background:#dbeafe; color:#1d4ed8; }
    body.light-theme .badge-video { background:#ede9fe; color:#6d28d9; }
    body.light-theme .badge-pending { background:#fef3c7; color:#92400e; }
    body.light-theme .badge-reviewed { background:#dbeafe; color:#1d4ed8; }
    body.light-theme .badge-resolved { background:#dcfce7; color:#166534; }
    body.light-theme .badge-high { background:#fee2e2; color:#b91c1c; }
    body.light-theme .badge-medium { background:#fef3c7; color:#92400e; }
    body.light-theme .badge-low { background:#dcfce7; color:#166534; }
    body.light-theme .badge-new { background:#fee2e2; color:#b91c1c; }
    body.light-theme .filter-btn { background:#ffffff; color:#52647a; }
    body.light-theme .stat-card,
    body.light-theme .map-shell,
    body.light-theme .map-summary,
    body.light-theme .table-container,
    body.light-theme .incident-metric {
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    body.light-theme .module-title h2,
    body.light-theme .map-summary h3,
    body.light-theme .map-list-title { color:#0f172a; }
    body.light-theme .sidebar-btn { color:#26384f; }
    body.light-theme .sidebar-btn.active { color:#ffffff; }
    body.light-theme .table-container { background:#ffffff; }
    body.light-theme th { background:#f3f7fc; color:#34465c; }
    body.light-theme tr:hover { background:#eaf2fb; }
    body.light-theme .stat-card { border-color:#c4d0df; }
    body.light-theme .filter-btn:hover,
    body.light-theme .filter-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
      box-shadow: 0 6px 14px rgba(29, 78, 216, 0.18);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-badge {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #3b82f6, var(--primary));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-strong);
    }
    .header p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .admin-layout {
      display: grid;
      grid-template-columns: 250px minmax(0, 1fr);
      min-height: calc(100vh - 83px);
    }
    .sidebar {
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-soft);
      padding: 20px 16px;
      position: sticky;
      top: 0;
      height: calc(100vh - 83px);
      overflow-y: auto;
    }
    .sidebar-label {
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      padding: 8px 10px;
    }
    .sidebar-nav {
      display: grid;
      gap: 6px;
    }
    .sidebar-btn {
      width: 100%;
      border: 1px solid transparent;
      background: transparent;
      color: var(--sidebar-text);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      letter-spacing: 0;
      text-align: left;
    }
    .sidebar-btn:hover { background: var(--sidebar-hover); border-color: var(--border); }
    .sidebar-btn.active { background: var(--primary); color: #fff; }
    .sidebar-icon {
      width: 20px;
      text-align: center;
      color: inherit;
      opacity: 0.95;
    }
    .main-panel {
      min-width: 0;
    }
    .module-section {
      display: none;
      padding: 28px 34px;
    }
    .module-section.active {
      display: block;
    }
    .module-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .module-title h2 {
      font-size: 20px;
      color: var(--text-strong);
      margin-bottom: 4px;
    }
    .module-title p {
      color: var(--text-muted);
      font-size: 13px;
    }
    .stats-bar {
      display: flex;
      gap: 24px;
      padding: 20px 32px;
      border-bottom: 1px solid var(--border-soft);
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px 24px;
      flex: 1;
      text-align: center;
    }
    .stat-card .number {
      font-size: 30px;
      font-weight: 700;
      color: var(--text-strong);
    }
    .stat-card .label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .stat-card.new .number { color: #ef4444; }
    .stat-card.pending .number { color: #f59e0b; }
    .stat-card.reviewed .number { color: #3b82f6; }
    .stat-card.resolved .number { color: #22c55e; }
    .content {
      padding: 24px 32px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .toolbar h2 {
      font-size: 18px;
      font-weight: 600;
    }
    .toolbar .refresh-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    .toolbar .refresh-btn:hover { background: #2563eb; }
    .logout-btn {
      background: transparent;
      border: 1px solid #334155;
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    .logout-btn:hover { border-color: #60a5fa; color: var(--text-strong); }

    .theme-toggle { display:flex; align-items:center; gap:8px; }
    .theme-select { background: var(--bg-card-strong); color: var(--text); border:1px solid var(--border); border-radius:8px; padding:8px 10px; font-weight:700; }
    .report-control-grid { display:grid; grid-template-columns: 1.2fr repeat(4, minmax(0, 1fr)); gap:12px; margin-bottom:16px; }
    .report-filter-input, .report-filter-select { min-width:0; background: var(--bg-card-strong); color: var(--text); border:1px solid var(--border); border-radius:8px; padding:11px 12px; font-size:14px; font-weight:500; }
    .incident-metrics { display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:16px; }
    .incident-metric { background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:12px; }
    .incident-metric strong { display:block; color:var(--text-strong); font-size:20px; }
    .incident-metric span { display:block; color:var(--text-muted); font-size:12px; margin-top:3px; }
    th.sortable { cursor:pointer; user-select:none; }
    th.sortable:hover { color: var(--link); }
    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .filter-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 8px 17px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--primary);
      border-color: #3b82f6;
      color: #fff;
    }
    /* Critical Leaflet CSS fallback: keeps map tiles positioned even if CDN CSS is blocked. */
    .leaflet-container {
      overflow: hidden;
      position: relative;
      outline-style: none;
      font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;
      background: #dbe7ed;
    }
    .leaflet-pane,
    .leaflet-tile,
    .leaflet-marker-icon,
    .leaflet-marker-shadow,
    .leaflet-tile-container,
    .leaflet-pane > svg,
    .leaflet-pane > canvas,
    .leaflet-zoom-box,
    .leaflet-image-layer,
    .leaflet-layer {
      position: absolute;
      left: 0;
      top: 0;
    }
    .leaflet-tile,
    .leaflet-marker-icon,
    .leaflet-marker-shadow {
      user-select: none;
      -webkit-user-drag: none;
    }
    .leaflet-tile {
      filter: inherit;
      visibility: hidden;
    }
    .leaflet-tile-loaded { visibility: inherit; }
    .leaflet-zoom-animated { transform-origin: 0 0; }
    .leaflet-interactive { cursor: pointer; }
    .leaflet-control {
      position: relative;
      z-index: 800;
      pointer-events: auto;
    }
    .leaflet-top, .leaflet-bottom {
      position: absolute;
      z-index: 1000;
      pointer-events: none;
    }
    .leaflet-top { top: 0; }
    .leaflet-right { right: 0; }
    .leaflet-bottom { bottom: 0; }
    .leaflet-left { left: 0; }
    .leaflet-control-zoom a {
      display: block;
      width: 26px;
      height: 26px;
      line-height: 26px;
      text-align: center;
      text-decoration: none;
      background: #fff;
      color: #111827;
      border-bottom: 1px solid #cbd5e1;
    }
    .leaflet-tile-pane { z-index: 200; }
    .leaflet-overlay-pane { z-index: 400; }
    .leaflet-marker-pane { z-index: 600; }
    .leaflet-tooltip-pane { z-index: 650; }
    .leaflet-popup-pane { z-index: 700; }
    .leaflet-marker-icon { pointer-events: auto; }
    .leaflet-popup { position: absolute; text-align: center; margin-bottom: 20px; }
    .leaflet-popup-content-wrapper { padding: 1px; text-align: left; border-radius: 8px; }
    .leaflet-popup-content { margin: 12px; min-width: 180px; }
    .leaflet-popup-tip-container { width: 40px; height: 20px; position: absolute; left: 50%; margin-left: -20px; overflow: hidden; pointer-events: none; }
    .leaflet-popup-tip { width: 17px; height: 17px; padding: 1px; margin: -10px auto 0; transform: rotate(45deg); }
    .map-panel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 16px;
      margin-bottom: 24px;
    }
    .map-shell {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: var(--surface-shadow);
      overflow: hidden;
      position: relative;
    }
    #crimeMap {
      width: 100%;
      height: 560px;
      min-height: 560px;
      display: block;
      background: var(--bg-root);
    }

    .map-canvas-wrap {
      position: relative;
    }

    .map-controls {
      background: var(--control-bg);
      border: 1px solid var(--control-border);
      border-radius: 12px;
      padding: 14px;
      display: grid;
      gap: 10px;
      margin: 12px;
    }
    .map-control-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .map-control-label {
      font-size: 13px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.4px;
    }
    .map-select, .map-search {
      min-width: 0;
      flex: 1;
      background: var(--bg-card-strong);
      color: var(--control-text);
      border: 1px solid var(--control-border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
    }
    .map-control-btn {
      background: var(--primary);
      color: #fff;
      border: 0;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .map-control-btn.secondary {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }
    .map-toggle-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .map-toggle {
      min-width: 108px;
      display: flex;
      align-items: center;
      gap: 5px;
      background: var(--bg-card-strong);
      border: 1px solid var(--control-border);
      border-radius: 8px;
      padding: 8px 10px;
      color: var(--control-text);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }
    .map-toggle input { accent-color: #3b82f6; }
    .map-help {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.35;
    }
    .map-search-status {
      min-height: 14px;
      font-size: 11px;
      color: #fbbf24;
    }

    .map-empty {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
      background: var(--map-empty-bg);
      z-index: 401;
    }
    .map-summary {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: var(--surface-shadow);
      padding: 20px;
      max-height: 720px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .map-summary h3 {
      font-size: 16px;
      margin-bottom: 14px;
      color: var(--text-strong);
    }
    .map-metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .map-metric {
      background: var(--bg-root);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
    }
    .map-metric strong {
      display: block;
      font-size: 22px;
      color: var(--text-strong);
    }
    .map-metric span {
      display: block;
      margin-top: 2px;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .map-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }
    .map-list-item {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
      background: var(--bg-root);
      cursor: pointer;
    }
    .map-list-item:hover { border-color: #60a5fa; }
    .map-list-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    .map-list-meta {
      font-size: 12px;
      color: var(--text-muted);
    }
    .map-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0 16px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 5px;
    }
    .crime-marker {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.45);
    }
    .crime-marker.new { background: #ef4444; }
    .crime-marker.pending { background: #7f1d1d; }
    .crime-marker.reviewed { background: #3b82f6; }
    .crime-marker.resolved { background: #22c55e; }
    .crime-marker.searched { width: 30px; height: 30px; border-color: var(--text-strong); box-shadow: 0 0 0 6px rgba(59,130,246,0.35), 0 8px 18px rgba(0,0,0,0.55); }
    .leaflet-popup-content-wrapper, .leaflet-popup-tip {
      background: var(--bg-root);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .map-popup h4 { margin: 0 0 8px; font-size: 14px; }
    .map-popup p { margin: 4px 0; font-size: 12px; color: var(--text); }
    .map-popup button, .map-popup a {
      display: inline-block;
      margin-top: 8px;
      margin-right: 6px;
      border: 0;
      border-radius: 6px;
      padding: 6px 8px;
      background: var(--primary);
      color: #fff;
      font-size: 12px;
      text-decoration: none;
      cursor: pointer;
    }
    .management-panel {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .management-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      min-width: 0;
    }
    .management-card h3 {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--text-strong);
    }
    .admin-form {
      display: grid;
      gap: 8px;
      margin-bottom: 12px;
    }
    .admin-input, .admin-select, .admin-textarea {
      width: 100%;
      min-width: 0;
      background: var(--bg-card-strong);
      color: var(--control-text);
      border: 1px solid var(--control-border);
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 13px;
    }
    .admin-textarea { min-height: 72px; resize: vertical; }
    .admin-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .admin-action-btn {
      border: 0;
      border-radius: 8px;
      padding: 9px 12px;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
    .admin-list { display: grid; gap: 8px; max-height: 330px; overflow-y: auto; }
    .admin-list-item {
      border: 1px solid var(--border);
      background: var(--bg-root);
      border-radius: 10px;
      padding: 10px;
      font-size: 12px;
      color: var(--text);
    }
    .admin-list-title { color: var(--text-strong); font-weight: 800; margin-bottom: 4px; }
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: var(--bg-root);
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 14px 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--border-soft);
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(59, 130, 246, 0.05); }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-photo { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-video { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .badge-new { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-reviewed { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-referred { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .badge-resolved { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-rejected { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
    .badge-high { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-medium { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-low { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

    .delete-report-btn {
      border: 1px solid rgba(239, 68, 68, 0.35);
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border-radius: 7px;
      padding: 6px 9px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      margin-left: 6px;
      white-space: nowrap;
    }
    .delete-report-btn:hover { background: rgba(239, 68, 68, 0.22); }
    body.light-theme .delete-report-btn {
      background:#fee2e2;
      border-color:#fecaca;
      color:#b91c1c;
    }
    body.light-theme .delete-report-btn:hover { background:#fecaca; }

    .status-select {
      background: var(--bg-root);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 9px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .description-cell {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tags-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tag {
      background: rgba(99, 102, 241, 0.15);
      color: var(--link);
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.4;
    }
    .empty-state h3 { font-size: 18px; margin-bottom: 8px; color: var(--text-muted); }
    .empty-state p { font-size: 14px; }
    .location-link {
      color: #60a5fa;
      text-decoration: none;
      font-size: 13px;
    }
    .location-link:hover { text-decoration: underline; }
    .reporter-info { font-size: 13px; color: var(--text-muted); }
    .detail-modal {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    .detail-modal.show { display: flex; }
    .detail-content {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    .detail-content h3 {
      font-size: 18px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 24px;
      cursor: pointer;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid var(--border-soft);
    }
    .detail-label {
      width: 140px;
      font-size: 13px;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .detail-value {
      font-size: 14px;
      color: var(--text);
      flex: 1;
    }

    /* Readability polish for the operational dashboard layout. */
    body.light-theme .module-section { padding: 28px 34px; }
    body.light-theme .stats-bar { gap: 18px; padding: 22px 34px; }
    body.light-theme .stat-card { padding: 18px 24px; }
    body.light-theme .filter-bar { gap: 12px; margin-bottom: 18px; }
    body.light-theme .filter-btn { font-size: 14px; font-weight: 700; padding: 8px 17px; border-color:#b7c6d8; }
    body.light-theme .map-controls { padding: 14px; }
    body.light-theme .map-select,
    body.light-theme .map-search,
    body.light-theme .report-filter-input,
    body.light-theme .report-filter-select { font-size: 14px; font-weight: 500; padding: 10px 12px; }
    body.light-theme .map-control-label { font-size: 12px; color:#34465c; }
    body.light-theme .map-control-btn { font-size: 13px; padding: 9px 12px; }
    body.light-theme .map-toggle { min-width:108px; font-size:13px; font-weight:500; padding:8px 10px; }
    body.light-theme .map-help { font-size:12px; color:#475569; }
    body.light-theme .map-panel { grid-template-columns: minmax(0, 1fr) 340px; }
    body.light-theme .map-summary { padding: 20px; }
    body.light-theme .map-summary h3 { font-size:17px; }
    body.light-theme .map-list-title { font-size:14px; }
    body.light-theme .map-list-meta { font-size:13px; }
    body.light-theme th { padding: 13px 16px; font-size:12px; font-weight:700; color:#34465c; background:#f3f7fc; }
    body.light-theme td { padding: 15px 16px; font-size:14px; font-weight:500; line-height:1.4; color:#172033; }
    body.light-theme .badge { padding:4px 10px; font-weight:700; line-height:1.2; }
    body.light-theme .status-select { font-size:13px; padding:6px 9px; }

    @media (max-width: 768px) {
      .admin-layout { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--border-soft); }
      .sidebar-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .module-section { padding: 16px; }
      .stats-bar { flex-direction: column; padding: 0; }
      .header { padding: 16px; }
      .content { padding: 0; }
      .map-panel { grid-template-columns: 1fr; }
      .management-panel { grid-template-columns: 1fr; }
      #crimeMap { height: 420px; min-height: 420px; }
      .map-summary { max-height: none; }
      .table-container { overflow-x: auto; }
      table { min-width: 900px; }
    }
    body.role-viewer .delete-report-btn { display: none !important; }
    body.role-viewer .status-select { pointer-events: none; opacity: 0.6; }
    body.role-viewer .admin-action-btn { display: none !important; }
    body.role-viewer .admin-form { display: none !important; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="header-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <h1>Crime Reporting PNG</h1>
        <p id="moduleSubtitle">Admin Portal - Dashboard</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="theme-toggle"><label for="themeSelect">Theme</label><select id="themeSelect" class="theme-select" onchange="setTheme(this.value)"><option value="dark">Dark</option><option value="light">Light</option></select></div>
      <form method="POST" action="/api/admin/logout">
        <button class="logout-btn" type="submit">Log out</button>
      </form>
    </div>
  </div>

  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-label">Modules</div>
      <nav class="sidebar-nav">
        <button class="sidebar-btn active" data-module-target="dashboard" onclick="showModule('dashboard', this)"><span class="sidebar-icon">DB</span>Dashboard</button>
        <button class="sidebar-btn" data-module-target="reports" onclick="showModule('reports', this)"><span class="sidebar-icon">RM</span>Reports & Map</button>
        <button class="sidebar-btn" data-module-target="locations" onclick="showModule('locations', this)"><span class="sidebar-icon">LC</span>Location Cascade</button>
        <button class="sidebar-btn" data-module-target="users" onclick="showModule('users', this)"><span class="sidebar-icon">US</span>Users</button>
        <button class="sidebar-btn" data-module-target="stations" onclick="showModule('stations', this)"><span class="sidebar-icon">PS</span>Stations & Posts</button>
        <button class="sidebar-btn" data-module-target="notifications" onclick="showModule('notifications', this)"><span class="sidebar-icon">NT</span>Notifications</button>
      </nav>
    </aside>
    <main class="main-panel">
      <section class="module-section active" data-module="dashboard">
        <div class="module-heading">
          <div class="module-title"><h2>Dashboard</h2><p>Operational report totals and quick status overview.</p></div>
        </div>
        <div class="stats-bar">
          <div class="stat-card"><div class="number" id="totalCount">0</div><div class="label">Total Reports</div></div>
          <div class="stat-card new"><div class="number" id="newCount">0</div><div class="label">New</div></div>
          <div class="stat-card pending"><div class="number" id="pendingCount">0</div><div class="label">Pending</div></div>
          <div class="stat-card reviewed"><div class="number" id="reviewedCount">0</div><div class="label">Reviewed</div></div>
          <div class="stat-card resolved"><div class="number" id="resolvedCount">0</div><div class="label">Resolved</div></div>
        </div>
      </section>

      <section class="module-section" data-module="reports">
        <div class="content">
          <div class="toolbar">
            <div class="module-title"><h2>Evidence Reports</h2><p>Review submissions, map hotspots, and update report status.</p></div>
            <button class="refresh-btn" onclick="loadReports()">Refresh</button>
          </div>
          <div class="filter-bar">
            <button class="filter-btn active" onclick="filterReports('all', this)">All</button>
            <button class="filter-btn" onclick="filterReports('new', this)">New</button>
            <button class="filter-btn" onclick="filterReports('pending', this)">Pending</button>
            <button class="filter-btn" onclick="filterReports('reviewed', this)">Reviewed</button>
            <button class="filter-btn" onclick="filterReports('resolved', this)">Resolved</button>
          </div>
          <div class="report-control-grid">
            <input id="reportSearch" class="report-filter-input" placeholder="Search reports" oninput="renderReports(); renderCrimeMap(); updateIncidentMetrics();">
            <select id="incidentFilter" class="report-filter-select" onchange="renderReports(); renderCrimeMap(); updateIncidentMetrics();"><option value="">All incidents</option></select>
            <select id="priorityFilter" class="report-filter-select" onchange="renderReports(); renderCrimeMap(); updateIncidentMetrics();"><option value="">All priorities</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
            <input id="dateFromFilter" class="report-filter-input" type="date" onchange="renderReports(); renderCrimeMap(); updateIncidentMetrics();">
            <input id="dateToFilter" class="report-filter-input" type="date" onchange="renderReports(); renderCrimeMap(); updateIncidentMetrics();">
          </div>
          <div id="incidentMetrics" class="incident-metrics"></div>
          <div class="map-panel">
            <div class="map-shell">
              <div class="map-controls">
                <div class="map-control-row">
                  <label class="map-control-label" for="basemapSelect">Basemap</label>
                  <select id="basemapSelect" class="map-select" onchange="changeBasemap(this.value)">
                    <option value="street">Street</option>
                    <option value="humanitarian">Humanitarian</option>
                    <option value="topographic">Topographic</option>
                    <option value="satellite">Satellite</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div class="map-control-row">
                  <input id="mapSearch" class="map-search" placeholder="Search reference, location, agency" onkeydown="if(event.key === 'Enter') searchMap()">
                  <button class="map-control-btn" onclick="searchMap()">Find</button>
                </div>
                <div id="mapSearchStatus" class="map-search-status"></div>
                <div class="map-control-row">
                  <button class="map-control-btn secondary" onclick="fitMapToReports(true)">Fit Reports</button>
                  <button class="map-control-btn secondary" onclick="focusPNG()">PNG</button>
                  <button class="map-control-btn secondary" onclick="clearMapSearch()">Clear</button>
                </div>
                <div>
                  <div class="map-control-label" style="margin-bottom:6px">Status</div>
                  <div class="map-toggle-group">
                    <label class="map-toggle"><input type="checkbox" data-map-status="new" checked onchange="updateMapToggles()">New</label>
                    <label class="map-toggle"><input type="checkbox" data-map-status="pending" checked onchange="updateMapToggles()">Pending</label>
                    <label class="map-toggle"><input type="checkbox" data-map-status="reviewed" checked onchange="updateMapToggles()">Reviewed</label>
                    <label class="map-toggle"><input type="checkbox" data-map-status="resolved" checked onchange="updateMapToggles()">Resolved</label>
                  </div>
                </div>
                <div>
                  <div class="map-control-label" style="margin-bottom:6px">Priority</div>
                  <div class="map-toggle-group">
                    <label class="map-toggle"><input type="checkbox" data-map-priority="high" checked onchange="updateMapToggles()">High</label>
                    <label class="map-toggle"><input type="checkbox" data-map-priority="medium" checked onchange="updateMapToggles()">Medium</label>
                    <label class="map-toggle"><input type="checkbox" data-map-priority="low" checked onchange="updateMapToggles()">Low</label>
                  </div>
                </div>
                <div class="map-help">Tip: click a marker to open the report. Use Fit Reports after panning or changing controls.</div>
              </div>
              <div class="map-canvas-wrap">
                <div id="crimeMap"></div>
                <div id="mapEmpty" class="map-empty">No reports with GPS coordinates match this filter.</div>
              </div>
            </div>
            <aside class="map-summary">
              <h3>Map Intelligence</h3>
              <div class="map-metric-grid">
                <div class="map-metric"><strong id="mappedCount">0</strong><span>Mapped</span></div>
                <div class="map-metric"><strong id="unmappedCount">0</strong><span>No GPS</span></div>
                <div class="map-metric"><strong id="urgentMapCount">0</strong><span>High Priority</span></div>
                <div class="map-metric"><strong id="pendingMapCount">0</strong><span>Pending</span></div>
              </div>
              <div class="map-legend">
                <span><i class="legend-dot" style="background:#ef4444"></i>New</span>
                <span><i class="legend-dot" style="background:#7f1d1d"></i>Pending</span>
                <span><i class="legend-dot" style="background:#3b82f6"></i>Reviewed</span>
                <span><i class="legend-dot" style="background:#22c55e"></i>Resolved</span>
              </div>
              <h3>Action Hotspots</h3>
              <div id="hotspotList" class="map-list"></div>
              <h3 style="margin-top:18px">Priority Dispatch</h3>
              <div id="priorityList" class="map-list"></div>
            </aside>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th class="sortable" onclick="sortReports('reference')">Reference</th><th class="sortable" onclick="sortReports('date')">Date</th><th class="sortable" onclick="sortReports('type')">Type</th><th class="sortable" onclick="sortReports('incident')">Incident</th><th>Description</th><th class="sortable" onclick="sortReports('location')">Location</th><th class="sortable" onclick="sortReports('agency')">Agency</th><th class="sortable" onclick="sortReports('priority')">Priority</th><th class="sortable" onclick="sortReports('reporter')">Reporter</th><th class="sortable" onclick="sortReports('status')">Status</th><th>Actions</th></tr></thead>
              <tbody id="reportsBody"></tbody>
            </table>
            <div id="emptyState" class="empty-state" style="display:none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <h3>No reports yet</h3><p>Evidence reports submitted from the app will appear here.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="module-section" data-module="locations">
        <section class="management-card">
          <h3>Location Cascade</h3>
          <div class="admin-form">
            <div class="admin-form-row"><input id="commandName" class="admin-input" placeholder="Command / Region name"><input id="commandCode" class="admin-input" placeholder="Code e.g. NCD"></div>
            <button class="admin-action-btn" onclick="savePoliceCommand()">Add Command</button>
            <select id="provinceCommand" class="admin-select"><option value="">Select command for province</option></select>
            <div class="admin-form-row"><input id="provinceName" class="admin-input" placeholder="Province name"><input id="provinceCode" class="admin-input" placeholder="Province code"></div>
            <button class="admin-action-btn" onclick="saveProvince()">Add Province</button>
            <select id="districtProvince" class="admin-select"><option value="">Select province for district</option></select>
            <div class="admin-form-row"><input id="districtName" class="admin-input" placeholder="District name"><input id="districtCode" class="admin-input" placeholder="District code"></div>
            <button class="admin-action-btn" onclick="saveDistrict()">Add District</button>
          </div>
        </section>
      </section>

      <section class="module-section" data-module="users">
        <section class="management-card">
          <h3>User Management</h3>
          <div class="admin-form">
            <input id="adminUserName" class="admin-input" placeholder="Full name">
            <div class="admin-form-row"><input id="adminUsername" class="admin-input" placeholder="Username"><select id="adminUserRole" class="admin-select"><option value="dispatcher">Dispatcher</option><option value="commander">Commander</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select></div>
            <select id="adminUserStation" class="admin-select"><option value="">No station assignment</option></select>
            <div class="admin-form-row"><input id="adminUserPhone" class="admin-input" placeholder="Phone"><input id="adminUserEmail" class="admin-input" placeholder="Email"></div>
            <button class="admin-action-btn" onclick="saveAdminUser()">Add User</button>
          </div>
          <div id="adminUsersList" class="admin-list"></div>
        </section>
      </section>

      <section class="module-section" data-module="stations">
        <section class="management-card">
          <h3>Police Station/Post Management</h3>
          <div class="admin-form">
            <select id="stationCommand" class="admin-select" onchange="refreshStationCascade()"><option value="">Select command / region</option></select>
            <select id="stationProvince" class="admin-select" onchange="refreshStationCascade()"><option value="">Select province</option></select>
            <select id="stationDistrict" class="admin-select"><option value="">Select district</option></select>
            <div class="admin-form-row"><input id="stationName" class="admin-input" placeholder="Station/post name"><select id="stationType" class="admin-select"><option value="station">Station</option><option value="post">Post</option><option value="command_center">Command Center</option></select></div>
            <input id="stationAddress" class="admin-input" placeholder="Address">
            <div class="admin-form-row"><input id="stationLatitude" class="admin-input" placeholder="Latitude"><input id="stationLongitude" class="admin-input" placeholder="Longitude"></div>
            <div class="admin-form-row"><input id="stationPhone" class="admin-input" placeholder="Command phone"><input id="stationEmail" class="admin-input" placeholder="Command email"></div>
            <div class="admin-form-row"><input id="stationCommander" class="admin-input" placeholder="Commander name"><input id="stationRadius" class="admin-input" placeholder="Response radius km" value="20"></div>
            <textarea id="stationNotes" class="admin-textarea" placeholder="Operational notes"></textarea>
            <button class="admin-action-btn" onclick="savePoliceStation()">Add Station</button>
          </div>
          <div id="policeStationsList" class="admin-list"></div>
        </section>
      </section>

      <section class="module-section" data-module="notifications">
        <section class="management-card">
          <h3>Notifications</h3>
          <div class="admin-form">
            <select id="notificationStation" class="admin-select"><option value="">Select station</option></select>
            <input id="notificationTitle" class="admin-input" placeholder="Notification title" value="Command message">
            <textarea id="notificationMessage" class="admin-textarea" placeholder="Message to police command"></textarea>
            <button class="admin-action-btn" onclick="sendAdminNotification()">Send Notification</button>
          </div>
          <div id="notificationsList" class="admin-list"></div>
        </section>
      </section>
    </main>
  </div>

  <div class="detail-modal" id="detailModal">
    <div class="detail-content" id="detailContent"></div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>

    const moduleTitles = {
      dashboard: 'Admin Portal - Dashboard',
      reports: 'Admin Portal - Evidence Reports',
      locations: 'Admin Portal - Location Cascade',
      users: 'Admin Portal - User Management',
      stations: 'Admin Portal - Police Stations & Posts',
      notifications: 'Admin Portal - Notifications',
    };

    function showModule(moduleName, button) {
      document.querySelectorAll('.module-section').forEach(function(section) {
        section.classList.toggle('active', section.dataset.module === moduleName);
      });
      document.querySelectorAll('.sidebar-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn === button || btn.dataset.moduleTarget === moduleName);
      });
      const subtitle = document.getElementById('moduleSubtitle');
      if (subtitle) subtitle.textContent = moduleTitles[moduleName] || 'Admin Portal';
      if (moduleName === 'reports') {
        setTimeout(function() {
          if (crimeMap) crimeMap.invalidateSize();
          renderCrimeMap();
        }, 80);
      }
    }

    let allReports = [];
    let currentFilter = 'all';
    let crimeMap = null;
    let markerLayer = null;
    let activeTileLayer = null;
    let sortKey = 'date';
    let sortDirection = 'desc';
    let searchedReportId = null;
    let mapHasUserFocus = false;
    let lastMapFilter = null;
    const PNG_MAP_CENTER = [-6.314993, 143.95555];
    const PNG_MAP_ZOOM = 6;
    const PNG_MAP_BOUNDS = [[-12.2, 140.6], [-1.0, 156.7]];
    const productionOrigin = window.location.origin;



    function setTheme(themeName) {
      const nextTheme = themeName === 'light' ? 'light' : 'dark';
      document.body.classList.toggle('light-theme', nextTheme === 'light');
      const select = document.getElementById('themeSelect');
      if (select) select.value = nextTheme;
      localStorage.setItem('cpng_admin_theme', nextTheme);
      setTimeout(function() { if (crimeMap) crimeMap.invalidateSize(); }, 80);
    }

    function initTheme() {
      setTheme(localStorage.getItem('cpng_admin_theme') || 'dark');
    }

    function normalizeStatus(report) {
      return String(report.status || 'new').toLowerCase();
    }

    function reportMatchesDate(report, fromValue, toValue) {
      const time = new Date(report.submittedAt).getTime();
      if (!Number.isFinite(time)) return true;
      if (fromValue) {
        const fromTime = new Date(fromValue + 'T00:00:00').getTime();
        if (time < fromTime) return false;
      }
      if (toValue) {
        const toTime = new Date(toValue + 'T23:59:59').getTime();
        if (time > toTime) return false;
      }
      return true;
    }

    function getReportSearchText(report) {
      return [
        report.referenceNumber,
        report.id,
        report.evidenceType,
        report.incidentType,
        report.description,
        report.address,
        report.agency,
        report.priority,
        report.reporterName,
        report.status,
      ].filter(Boolean).join(' ').toLowerCase();
    }

    function controlValue(id) {
      const el = document.getElementById(id);
      return el && typeof el.value === 'string' ? el.value : '';
    }

    function getFilteredReports() {
      const source = Array.isArray(allReports) ? allReports : [];
      const search = controlValue('reportSearch').trim().toLowerCase();
      const incident = controlValue('incidentFilter');
      const priority = controlValue('priorityFilter').toLowerCase();
      const fromDate = controlValue('dateFromFilter');
      const toDate = controlValue('dateToFilter');
      return source.filter(function(report) {
        const status = normalizeStatus(report);
        const incidentName = report.incidentType || 'Unspecified';
        const reportPriority = String(report.priority || '').toLowerCase();
        return (currentFilter === 'all' || status === currentFilter)
          && (!search || getReportSearchText(report).includes(search))
          && (!incident || incidentName === incident)
          && (!priority || reportPriority === priority)
          && reportMatchesDate(report, fromDate, toDate);
      });
    }

    function sortReports(key) {
      if (sortKey === key) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDirection = key === 'date' ? 'desc' : 'asc'; }
      renderReports();
    }

    function sortedReports(reports) {
      if (typeof sortKey === 'undefined') window.sortKey = 'date';
      if (typeof sortDirection === 'undefined') window.sortDirection = 'desc';
      const valueFor = function(report) {
        if (sortKey === 'date') return new Date(report.submittedAt).getTime() || 0;
        if (sortKey === 'reference') return report.referenceNumber || report.id || '';
        if (sortKey === 'type') return report.evidenceType || '';
        if (sortKey === 'incident') return report.incidentType || '';
        if (sortKey === 'location') return report.address || '';
        if (sortKey === 'agency') return report.agency || '';
        if (sortKey === 'priority') return report.priority || '';
        if (sortKey === 'reporter') return report.reporterName || (report.isAnonymous ? 'Anonymous' : '');
        if (sortKey === 'status') return normalizeStatus(report);
        return '';
      };
      return reports.slice().sort(function(a, b) {
        const av = valueFor(a);
        const bv = valueFor(b);
        const result = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sortDirection === 'asc' ? result : -result;
      });
    }

    function updateIncidentFilterOptions() {
      const select = document.getElementById('incidentFilter');
      if (!select) return;
      const selected = select.value;
      const incidents = Array.from(new Set(allReports.map(function(report) { return report.incidentType || 'Unspecified'; }))).sort();
      select.innerHTML = '<option value="">All incidents</option>' + incidents.map(function(name) {
        return '<option value="' + name + '"' + (selected === name ? ' selected' : '') + '>' + name + '</option>';
      }).join('');
    }

    function updateIncidentMetrics() {
      const container = document.getElementById('incidentMetrics');
      if (!container) return;
      const filtered = getFilteredReports();
      const counts = {};
      filtered.forEach(function(report) {
        const key = report.incidentType || 'Unspecified';
        counts[key] = (counts[key] || 0) + 1;
      });
      const rows = Object.entries(counts).sort(function(a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); }).slice(0, 8);
      container.innerHTML = rows.length
        ? rows.map(function(item) { return '<div class="incident-metric"><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div>'; }).join('')
        : '<div class="incident-metric"><strong>0</strong><span>No incidents match filters</span></div>';
    }

    const baseMaps = {
      street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' },
      },
      humanitarian: {
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors, HOT' },
      },
      topographic: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        options: { maxZoom: 17, attribution: '&copy; OpenStreetMap contributors, SRTM, OpenTopoMap' },
      },
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: { maxZoom: 19, attribution: 'Tiles &copy; Esri' },
      },
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' },
      },
    };

    function changeBasemap(name) {
      if (!crimeMap || typeof L === 'undefined') return;
      const config = baseMaps[name] || baseMaps.street;
      if (activeTileLayer) crimeMap.removeLayer(activeTileLayer);
      activeTileLayer = L.tileLayer(config.url, config.options).addTo(crimeMap);
    }

    function selectedToggleValues(selector, fallback) {
      const inputs = Array.from(document.querySelectorAll(selector));
      if (!inputs.length) return fallback;
      const checked = inputs.filter(function(input) { return input.checked; }).map(function(input) {
        return input.dataset.mapStatus || input.dataset.mapPriority;
      });
      return checked.length ? checked : [];
    }

    function getMapControlFilteredReports(reports) {
      const statuses = selectedToggleValues('input[data-map-status]', ['pending', 'reviewed', 'resolved']);
      const priorities = selectedToggleValues('input[data-map-priority]', ['high', 'medium', 'low']);
      return reports.filter(function(report) {
        return statuses.includes(String(report.status || '').toLowerCase())
          && priorities.includes(String(report.priority || 'medium').toLowerCase());
      });
    }

    function updateMapToggles() {
      mapHasUserFocus = false;
      renderCrimeMap();
    }

    let adminUsers = [];
    let policeStations = [];
    let notificationLogs = [];
    let policeCommands = [];
    let provinces = [];
    let districts = [];

    async function loadAdminManagement() {
      try {
        const [usersRes, stationsRes, notificationsRes, commandsRes, provincesRes, districtsRes] = await Promise.all([
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/admin/police-stations', { cache: 'no-store' }),
          fetch('/api/admin/notifications', { cache: 'no-store' }),
          fetch('/api/admin/location/commands', { cache: 'no-store' }),
          fetch('/api/admin/location/provinces', { cache: 'no-store' }),
          fetch('/api/admin/location/districts', { cache: 'no-store' }),
        ]);
        adminUsers = usersRes.ok ? await usersRes.json() : [];
        policeStations = stationsRes.ok ? await stationsRes.json() : [];
        notificationLogs = notificationsRes.ok ? await notificationsRes.json() : [];
        policeCommands = commandsRes.ok ? await commandsRes.json() : [];
        provinces = provincesRes.ok ? await provincesRes.json() : [];
        districts = districtsRes.ok ? await districtsRes.json() : [];
        renderAdminManagement();
      } catch (error) {
        console.error('Failed to load admin management:', error);
      }
    }

    function stationOptions(selected) {
      return '<option value="">No station assignment</option>' + policeStations.map(function(station) {
        return '<option value="' + station.id + '"' + (selected === station.id ? ' selected' : '') + '>' + station.name + '</option>';
      }).join('');
    }

    function renderAdminManagement() {
      const userStation = document.getElementById('adminUserStation');
      const notificationStation = document.getElementById('notificationStation');
      const provinceCommand = document.getElementById('provinceCommand');
      const districtProvince = document.getElementById('districtProvince');
      const stationCommand = document.getElementById('stationCommand');
      if (userStation) userStation.innerHTML = stationOptions('');
      if (notificationStation) notificationStation.innerHTML = '<option value="">Select station</option>' + policeStations.map(function(station) {
        return '<option value="' + station.id + '">' + station.name + '</option>';
      }).join('');
      if (provinceCommand) provinceCommand.innerHTML = optionList(policeCommands, 'Select command for province', provinceCommand.value);
      if (districtProvince) districtProvince.innerHTML = optionList(provinces, 'Select province for district', districtProvince.value);
      if (stationCommand) stationCommand.innerHTML = optionList(policeCommands, 'Select command / region', stationCommand.value);
      refreshStationCascade();

      document.getElementById('adminUsersList').innerHTML = adminUsers.length ? adminUsers.map(function(user) {
        const station = policeStations.find(function(item) { return item.id === user.stationId; });
        return '<div class="admin-list-item"><div class="admin-list-title">' + user.name + ' | ' + user.role + '</div>'
          + '<div>' + user.username + '</div><div>' + (station?.name || 'No station') + '</div><div>' + (user.phone || '-') + ' | ' + (user.email || '-') + '</div></div>';
      }).join('') : '<div class="admin-list-item">No users configured.</div>';

      document.getElementById('policeStationsList').innerHTML = policeStations.length ? policeStations.map(function(station) {
        return '<div class="admin-list-item"><div class="admin-list-title">' + station.name + '</div>'
          + '<div>' + station.stationType + ' | ' + (provinces.find(function(p) { return p.id === station.provinceId; })?.name || '-') + ' | ' + (districts.find(function(d) { return d.id === station.districtId; })?.name || '-') + '</div>'
          + '<div>GPS: ' + station.latitude + ', ' + station.longitude + ' | Radius: ' + station.responseRadiusKm + ' km</div>'
          + '<div>Command: ' + (station.commanderName || '-') + ' | ' + (station.commandPhone || '-') + ' | ' + (station.commandEmail || '-') + '</div></div>';
      }).join('') : '<div class="admin-list-item">No police stations configured.</div>';

      document.getElementById('notificationsList').innerHTML = notificationLogs.length ? notificationLogs.slice(0, 8).map(function(item) {
        return '<div class="admin-list-item"><div class="admin-list-title">' + item.title + '</div>'
          + '<div>' + item.message + '</div><div>' + item.channel + ' to ' + item.recipient + ' | ' + new Date(item.createdAt).toLocaleString() + '</div></div>';
      }).join('') : '<div class="admin-list-item">No notifications sent yet.</div>';
    }

    async function saveAdminUser() {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('adminUserName').value,
          username: document.getElementById('adminUsername').value,
          role: document.getElementById('adminUserRole').value,
          stationId: document.getElementById('adminUserStation').value || null,
          phone: document.getElementById('adminUserPhone').value || null,
          email: document.getElementById('adminUserEmail').value || null,
        }),
      });
      await loadAdminManagement();
    }

    async function savePoliceStation() {
      await fetch('/api/admin/police-stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('stationName').value,
          commandId: document.getElementById('stationCommand').value,
          provinceId: document.getElementById('stationProvince').value,
          districtId: document.getElementById('stationDistrict').value,
          stationType: document.getElementById('stationType').value,
          address: document.getElementById('stationAddress').value,
          latitude: document.getElementById('stationLatitude').value,
          longitude: document.getElementById('stationLongitude').value,
          commandPhone: document.getElementById('stationPhone').value,
          commandEmail: document.getElementById('stationEmail').value,
          commanderName: document.getElementById('stationCommander').value,
          responseRadiusKm: document.getElementById('stationRadius').value,
          notes: document.getElementById('stationNotes').value,
        }),
      });
      await loadAdminManagement();
    }

    async function sendAdminNotification() {
      const stationId = document.getElementById('notificationStation').value;
      const station = policeStations.find(function(item) { return item.id === stationId; });
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: stationId || null,
          title: document.getElementById('notificationTitle').value,
          message: document.getElementById('notificationMessage').value,
          channel: 'console',
          recipient: station?.commandEmail || station?.commandPhone || 'command',
        }),
      });
      await loadAdminManagement();
    }

    let lastReportsJson = '';
    async function loadReports() {
      try {
        const res = await fetch('/api/reports', { cache: 'no-store' });
        if (!res.ok) throw new Error('Reports request failed: ' + res.status);
        const reports = await res.json();
        const currentJson = JSON.stringify(reports);
        if (currentJson === lastReportsJson) {
          return;
        }
        lastReportsJson = currentJson;
        allReports = Array.isArray(reports) ? reports : [];
        updateStats();
        updateIncidentFilterOptions();
        renderReports();
        renderCrimeMap();
        updateIncidentMetrics();
      } catch (err) {
        console.error('Failed to load reports:', err);
      }
    }

    function updateStats() {
      document.getElementById('totalCount').textContent = allReports.length;
      document.getElementById('newCount').textContent = allReports.filter(r => normalizeStatus(r) === 'new').length;
      document.getElementById('pendingCount').textContent = allReports.filter(r => normalizeStatus(r) === 'pending').length;
      document.getElementById('reviewedCount').textContent = allReports.filter(r => normalizeStatus(r) === 'reviewed').length;
      document.getElementById('resolvedCount').textContent = allReports.filter(r => normalizeStatus(r) === 'resolved').length;
    }

    function filterReports(filter, btn) {
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderReports();
      renderCrimeMap();
    }


    function hasCoordinate(value) {
      return value !== null && value !== undefined && String(value).trim() !== '';
    }

    function getMappableReports(reports) {
      return reports
        .filter(function(r) {
          return hasCoordinate(r.latitude) && hasCoordinate(r.longitude);
        })
        .map(function(r) {
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          return { report: r, lat: lat, lng: lng };
        })
        .filter(function(item) {
          return Number.isFinite(item.lat)
            && Number.isFinite(item.lng)
            && item.lat >= -90
            && item.lat <= 90
            && item.lng >= -180
            && item.lng <= 180;
        });
    }
    function initCrimeMap() {
      if (crimeMap || typeof L === 'undefined') return;

      crimeMap = L.map('crimeMap', {
        zoomControl: true,
        scrollWheelZoom: true,
      });
      crimeMap.fitBounds(PNG_MAP_BOUNDS, { padding: [24, 24], maxZoom: PNG_MAP_ZOOM });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(crimeMap);

      markerLayer = L.layerGroup().addTo(crimeMap);
      crimeMap.on('dragstart zoomstart', function() { mapHasUserFocus = true; });
    }

    function markerClass(report) {
      const status = normalizeStatus(report);
      if (status === 'new') return 'crime-marker new';
      if (status === 'reviewed') return 'crime-marker reviewed';
      if (status === 'resolved') return 'crime-marker resolved';
      return 'crime-marker pending';
    }

    function markerIcon(report) {
      return L.divIcon({
        className: '',
        html: '<div class="' + markerClass(report) + '"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12],
      });
    }

    function reportLocationName(report) {
      if (!report.address) return 'Unknown location';
      return String(report.address).split(',').slice(0, 2).join(',').trim() || report.address;
    }

    function mapPopup(report) {
      const reference = report.referenceNumber || report.id.slice(0, 8).toUpperCase();
      const mapsUrl = 'https://www.google.com/maps?q=' + report.latitude + ',' + report.longitude;
      return '<div class="map-popup">'
        + '<h4>' + reference + '</h4>'
        + '<p><strong>' + (report.incidentType || report.evidenceType || 'Report') + '</strong> | ' + report.priority + ' | ' + report.status + '</p>'
        + '<p>' + reportLocationName(report) + '</p>'
        + '<p>' + (report.agency || '-') + '</p>'
        + '<button data-report-id="' + report.id + '" onclick="showDetail(this.dataset.reportId)">Open Report</button>'
        + '<a href="' + mapsUrl + '" target="_blank">Navigate</a>'
        + '</div>';
    }

    function updateMapSummary(filtered, mapped) {
      document.getElementById('mappedCount').textContent = mapped.length;
      document.getElementById('unmappedCount').textContent = filtered.length - mapped.length;
      document.getElementById('urgentMapCount').textContent = mapped.filter(item => String(item.report.priority).toLowerCase() === 'high').length;
      document.getElementById('pendingMapCount').textContent = mapped.filter(item => item.report.status === 'pending').length;

      const groups = {};
      mapped.forEach(function(item) {
        const key = reportLocationName(item.report);
        if (!groups[key]) groups[key] = { name: key, count: 0, high: 0, pending: 0, latest: 0, lat: item.lat, lng: item.lng };
        groups[key].count += 1;
        groups[key].high += String(item.report.priority).toLowerCase() === 'high' ? 1 : 0;
        groups[key].pending += item.report.status === 'pending' ? 1 : 0;
        groups[key].latest = Math.max(groups[key].latest, new Date(item.report.submittedAt).getTime() || 0);
      });

      const hotspots = Object.values(groups)
        .sort(function(a, b) { return (b.high - a.high) || (b.pending - a.pending) || (b.count - a.count) || (b.latest - a.latest); })
        .slice(0, 4);
      document.getElementById('hotspotList').innerHTML = hotspots.length
        ? hotspots.map(function(h) {
            return '<div class="map-list-item" onclick="focusMap(' + h.lat + ',' + h.lng + ',15)">'
              + '<div class="map-list-title">' + h.name + '</div>'
              + '<div class="map-list-meta">' + h.count + ' reports | ' + h.pending + ' pending | ' + h.high + ' high priority</div>'
              + '</div>';
          }).join('')
        : '<div class="map-list-meta">No mapped hotspots yet.</div>';

      const priorities = mapped
        .filter(function(item) { return item.report.status !== 'resolved'; })
        .sort(function(a, b) {
          const weight = { high: 3, medium: 2, low: 1 };
          return (weight[String(b.report.priority).toLowerCase()] || 2) - (weight[String(a.report.priority).toLowerCase()] || 2)
            || (new Date(b.report.submittedAt).getTime() - new Date(a.report.submittedAt).getTime());
        })
        .slice(0, 4);
      document.getElementById('priorityList').innerHTML = priorities.length
        ? priorities.map(function(item) {
            const r = item.report;
            return '<div class="map-list-item" data-report-id="' + r.id + '" onclick="focusReportOnMap(this.dataset.reportId)">'
              + '<div class="map-list-title">' + (r.referenceNumber || r.id.slice(0, 8).toUpperCase()) + ' | ' + r.priority + '</div>'
              + '<div class="map-list-meta">' + (r.incidentType || r.evidenceType) + ' | ' + reportLocationName(r) + '</div>'
              + '</div>';
          }).join('')
        : '<div class="map-list-meta">No open mapped dispatch items.</div>';
    }

    function renderCrimeMap() {
      const filtered = getFilteredReports();
      const mapFiltered = getMapControlFilteredReports(filtered);
      const mapped = getMappableReports(mapFiltered);
      updateMapSummary(mapFiltered, mapped);
      console.log('Map render', { filtered: filtered.length, mapFiltered: mapFiltered.length, mapped: mapped.length });

      if (typeof L === 'undefined') {
        document.getElementById('mapEmpty').style.display = 'flex';
        document.getElementById('mapEmpty').textContent = 'Map tiles could not load. Check the internet connection and refresh.';
        return;
      }

      initCrimeMap();
      markerLayer.clearLayers();
      document.getElementById('mapEmpty').style.display = mapped.length ? 'none' : 'flex';

      if (!mapped.length) return;

      const bounds = [];
      mapped.forEach(function(item) {
        const marker = L.marker([item.lat, item.lng], { icon: markerIcon(item.report) })
          .bindPopup(mapPopup(item.report));
        marker.on('click', function() { showDetail(item.report.id); });
        marker.reportId = item.report.id;
        marker.addTo(markerLayer);
        bounds.push([item.lat, item.lng]);
      });

      setTimeout(function() {
        crimeMap.invalidateSize();
        if (!mapHasUserFocus && !lastMapFilter) {
          crimeMap.fitBounds(PNG_MAP_BOUNDS, { padding: [24, 24], maxZoom: PNG_MAP_ZOOM });
          lastMapFilter = currentFilter;
        }
      }, 80);
    }



    function fitMapToReports(force) {
      if (!crimeMap) return;
      const mapped = getMappableReports(getMapControlFilteredReports(getFilteredReports()));
      if (!mapped.length) return;
      const bounds = mapped.map(function(item) { return [item.lat, item.lng]; });
      mapHasUserFocus = !force ? mapHasUserFocus : false;
      crimeMap.invalidateSize();
      crimeMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
      lastMapFilter = currentFilter;
    }

    function focusPNG() {
      if (!crimeMap) return;
      mapHasUserFocus = true;
      crimeMap.fitBounds(PNG_MAP_BOUNDS, { padding: [24, 24], maxZoom: PNG_MAP_ZOOM });
    }

    function searchableText(report) {
      return [
        report.referenceNumber,
        report.id,
        report.address,
        report.agency,
        report.incidentType,
        report.description,
        report.status,
        report.priority,
      ].filter(Boolean).join(' ').toLowerCase();
    }

    function searchMap() {
      const input = document.getElementById('mapSearch');
      const status = document.getElementById('mapSearchStatus');
      const query = (input?.value || '').trim().toLowerCase();
      if (!query) {
        clearMapSearch();
        return;
      }

      const mapped = getMappableReports(getMapControlFilteredReports(getFilteredReports()));
      const found = mapped.find(function(item) { return searchableText(item.report).includes(query); });
      if (!found) {
        searchedReportId = null;
        if (status) status.textContent = 'No mapped report matched that search.';
        renderCrimeMap();
        return;
      }

      searchedReportId = found.report.id;
      mapHasUserFocus = true;
      if (status) status.textContent = 'Found ' + (found.report.referenceNumber || found.report.id.slice(0, 8).toUpperCase());
      renderCrimeMap();
      focusReportOnMap(found.report.id);
    }

    function clearMapSearch() {
      const input = document.getElementById('mapSearch');
      const status = document.getElementById('mapSearchStatus');
      if (input) input.value = '';
      if (status) status.textContent = '';
      searchedReportId = null;
      renderCrimeMap();
    }

    function focusMap(lat, lng, zoom) {
      if (!crimeMap) return;
      crimeMap.setView([lat, lng], zoom || 15);
    }

    function focusReportOnMap(id) {
      if (!crimeMap || !markerLayer) return;
      markerLayer.eachLayer(function(marker) {
        if (marker.reportId === id) {
          crimeMap.setView(marker.getLatLng(), 16);
          marker.openPopup();
        }
      });
    }

    function renderReports() {
      const tbody = document.getElementById('reportsBody');
      const empty = document.getElementById('emptyState');
      const filtered = sortedReports(getFilteredReports());

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
      }
      empty.style.display = 'none';

      tbody.innerHTML = filtered.map(r => {
        const date = new Date(r.submittedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const typeBadge = '<span class="badge badge-' + r.evidenceType + '">' + r.evidenceType + '</span>';
        const priorityBadge = '<span class="badge badge-' + r.priority.toLowerCase() + '">' + r.priority + '</span>';
        const location = r.latitude && r.longitude
          ? '<a class="location-link" href="https://www.google.com/maps?q=' + r.latitude + ',' + r.longitude + '" target="_blank">' + (r.address || 'View Map') + '</a>'
          : (r.address || '-');
        const reporter = r.isAnonymous ? '<span style="color:var(--text-muted);font-style:italic">Anonymous</span>' : (r.reporterName || '-');

        const hasFile = r.fileUrl ? '<span class="file-dot" title="Evidence file attached">&#9679;</span>' : '';
        const reference = r.referenceNumber || r.id.slice(0, 8).toUpperCase();
        const statusClass = normalizeStatus(r);
        return '<tr data-report-id="' + r.id + '" onclick="showDetail(this.dataset.reportId)" style="cursor:pointer">'
          + '<td class="reference-cell">' + reference + '</td>'
          + '<td style="white-space:nowrap">' + date + '</td>'
          + '<td>' + typeBadge + hasFile + '</td>'
          + '<td>' + (r.incidentType || '-') + '</td>'
          + '<td class="description-cell">' + (r.description || '-') + '</td>'
          + '<td>' + location + '</td>'
          + '<td style="font-size:13px">' + r.agency + '</td>'
          + '<td>' + priorityBadge + '</td>'
          + '<td class="reporter-info">' + reporter + '</td>'
          + '<td><span class="badge badge-' + statusClass + '">' + r.status + '</span></td>'
          + '<td onclick="event.stopPropagation()">'
          + '<select class="status-select" data-report-id="' + r.id + '" onchange="updateStatus(this.dataset.reportId, this.value)">'
          + '<option value="New"' + (statusClass==='new'?' selected':'') + '>New</option>'
          + '<option value="Pending"' + (statusClass==='pending'?' selected':'') + '>Pending</option>'
          + '<option value="Reviewed"' + (statusClass==='reviewed'?' selected':'') + '>Reviewed</option>'
          + '<option value="Referred"' + (statusClass==='referred'?' selected':'') + '>Referred</option>'
          + '<option value="Resolved"' + (statusClass==='resolved'?' selected':'') + '>Resolved</option>'
          + '<option value="Rejected"' + (statusClass==='rejected'?' selected':'') + '>Rejected</option>'
          + '</select>'
          + '<button class="delete-report-btn" data-report-id="' + r.id + '" onclick="deleteReport(this.dataset.reportId)">Delete</button></td></tr>';
      }).join('');
    }


    async function deleteReport(id) {
      const report = allReports.find(function(item) { return item.id === id; });
      const reference = report ? (report.referenceNumber || report.id.slice(0, 8).toUpperCase()) : id;
      const reason = window.prompt('Enter the reason for deleting report ' + reference + ':');
      if (reason === null) return;
      const trimmedReason = reason.trim();
      if (trimmedReason.length < 8) {
        window.alert('Please enter a clearer reason. Minimum 8 characters.');
        return;
      }
      if (!window.confirm('Delete report ' + reference + '? This removes it from active reports and stores the reason in the audit log.')) return;

      try {
        const response = await fetch('/api/reports/' + id, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: trimmedReason })
        });
        if (!response.ok) {
          const error = await response.json().catch(function() { return {}; });
          throw new Error(error.message || 'Delete failed');
        }
        closeDetail();
        await loadReports();
      } catch (err) {
        console.error('Failed to delete report:', err);
        window.alert(err.message || 'Failed to delete report.');
      }
    }

    async function updateStatus(id, status) {
      try {
        await fetch('/api/reports/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status })
        });
        await loadReports();
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }

    function evidenceFileUrl(fileUrl) {
      if (!fileUrl) return '';
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
      if (fileUrl.startsWith('/uploads/')) return productionOrigin + fileUrl;
      return window.location.origin + fileUrl;
    }

    function buildMediaViewer(r) {
      if (!r.fileUrl) return '';
      const url = evidenceFileUrl(r.fileUrl);
      if (r.evidenceType === 'photo') {
        return '<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;background:#0a0f1a;text-align:center">'
          + '<img src="' + url + '" style="max-width:100%;max-height:420px;object-fit:contain;display:block;margin:0 auto" />'
          + '<div style="padding:8px;display:flex;justify-content:flex-end">'
          + '<a href="' + url + '" download target="_blank" style="color:#3b82f6;font-size:13px;text-decoration:none">Download</a>'
          + '</div></div>';
      } else if (r.evidenceType === 'video') {
        return '<div style="margin-bottom:20px;border-radius:10px;overflow:hidden;background:#0a0f1a">'
          + '<video controls style="width:100%;max-height:420px;display:block"><source src="' + url + '"></video>'
          + '<div style="padding:8px;display:flex;justify-content:flex-end">'
          + '<a href="' + url + '" download target="_blank" style="color:#3b82f6;font-size:13px;text-decoration:none">Download</a>'
          + '</div></div>';
      } else if (r.evidenceType === 'audio') {
        return '<div style="margin-bottom:20px;padding:20px;border-radius:10px;background:#0a0f1a;display:flex;flex-direction:column;gap:12px;align-items:center">'
          + '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
          + '<audio controls style="width:100%"><source src="' + url + '"></audio>'
          + '<a href="' + url + '" download target="_blank" style="color:#3b82f6;font-size:13px;text-decoration:none">Download</a>'
          + '</div>';
      }
      return '';
    }

    async function assignOfficer(reportId) {
      const officerUserId = document.getElementById('assignOfficerSelect').value;
      if (!officerUserId) return;
      try {
        const res = await fetch('/api/admin/reports/' + reportId + '/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ officerUserId: officerUserId })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to assign.');
        }
        showDetail(reportId);
      } catch (err) {
        alert(err.message);
      }
    }

    function showDetail(id) {
      const r = allReports.find(function(report) { return report.id === id; });
      if (!r) return;
      const date = new Date(r.submittedAt).toLocaleString();
      const tags = (r.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join(' ') || '-';
      const location = r.latitude && r.longitude
        ? '<a class="location-link" href="https://www.google.com/maps?q=' + r.latitude + ',' + r.longitude + '" target="_blank">' + (r.address || r.latitude + ', ' + r.longitude) + '</a>'
        : (r.address || 'Not available');
      const coordinates = r.latitude && r.longitude
        ? r.latitude + ', ' + r.longitude
        : 'Not available';

      const statusClass = normalizeStatus(r);

      // Behalf reporting info
      let behalfHtml = '';
      if (r.isBehalfReport) {
        behalfHtml = ''
          + '<div style="margin-top:16px;padding:12px;border:1px solid #3b82f6;border-radius:8px;background:rgba(59,130,246,0.05)">'
          + '<h4 style="color:#60a5fa;margin-bottom:8px">Reported on Behalf of Someone Else</h4>'
          + '<div class="detail-row"><div class="detail-label">Victim Name</div><div class="detail-value">' + (r.behalfName || 'Anonymous') + '</div></div>'
          + '<div class="detail-row"><div class="detail-label">Contact Info</div><div class="detail-value">' + (r.behalfContact || 'None') + '</div></div>'
          + '<div class="detail-row"><div class="detail-label">Relationship</div><div class="detail-value">' + (r.behalfRelationship || 'Not stated') + '</div></div>'
          + '<div class="detail-row"><div class="detail-label">Consent Obtained</div><div class="detail-value">' + (r.behalfConsent ? 'Yes \u2705' : 'No \u274C') + '</div></div>'
          + '</div>';
      } else {
        behalfHtml = ''
          + '<div style="margin-top:16px;padding:12px;border:1px solid var(--border-soft);border-radius:8px;background:rgba(255,255,255,0.02)">'
          + '<h4 style="color:var(--text-secondary);margin-bottom:8px">Report Source</h4>'
          + '<div class="detail-row"><div class="detail-label">Source Type</div><div class="detail-value">Direct Citizen App Submission</div></div>'
          + '</div>';
      }

      // Assignments and Manual Assignment containers
      let assignmentsHtml = ''
        + '<div style="margin-top:20px;border-top:1px solid var(--border-soft);padding-top:16px">'
        + '<div id="detailAssignments">Loading assignments...</div>'
        + '<div id="detailAssignForm" style="margin-top:16px">Loading assignment form...</div>'
        + '</div>';

      document.getElementById('detailContent').innerHTML = ''
        + '<h3>Report Details <button class="detail-close" onclick="closeDetail()">&times;</button></h3>'
        + buildMediaViewer(r)
        + '<div class="detail-row"><div class="detail-label">Reference</div><div class="detail-value reference-text">' + (r.referenceNumber || r.id.slice(0, 8).toUpperCase()) + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Report ID</div><div class="detail-value" style="font-size:12px;word-break:break-all">' + r.id + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Submitted</div><div class="detail-value">' + date + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Evidence Type</div><div class="detail-value"><span class="badge badge-' + r.evidenceType + '">' + r.evidenceType + '</span></div></div>'
        + '<div class="detail-row"><div class="detail-label">Incident Type</div><div class="detail-value">' + (r.incidentType || 'Not provided in submitted report') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Description</div><div class="detail-value">' + (r.description || 'Not provided in submitted report') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Location</div><div class="detail-value">' + location + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">GPS Coordinates</div><div class="detail-value">' + coordinates + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Tags</div><div class="detail-value"><div class="tags-cell">' + tags + '</div></div></div>'
        + '<div class="detail-row"><div class="detail-label">Agency</div><div class="detail-value">' + r.agency + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Priority</div><div class="detail-value"><span class="badge badge-' + r.priority.toLowerCase() + '">' + r.priority + '</span></div></div>'
        + '<div class="detail-row"><div class="detail-label">Reporter</div><div class="detail-value">' + (r.isAnonymous ? 'Anonymous' : (r.reporterName || '-')) + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Contact Phone</div><div class="detail-value">' + (r.contactPhone || '-') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Contact Email</div><div class="detail-value">' + (r.contactEmail || '-') + '</div></div>'
        + '<div class="detail-row"><div class="detail-label">Status</div><div class="detail-value">'
          + '<select class="status-select" data-report-id="' + r.id + '" onchange="updateStatus(this.dataset.reportId, this.value)">'
        + '<option value="New"' + (statusClass==='new'?' selected':'') + '>New</option>'
        + '<option value="Pending"' + (statusClass==='pending'?' selected':'') + '>Pending</option>'
        + '<option value="Reviewed"' + (statusClass==='reviewed'?' selected':'') + '>Reviewed</option>'
        + '<option value="Referred"' + (statusClass==='referred'?' selected':'') + '>Referred</option>'
        + '<option value="Resolved"' + (statusClass==='resolved'?' selected':'') + '>Resolved</option>'
        + '<option value="Rejected"' + (statusClass==='rejected'?' selected':'') + '>Rejected</option>'
        + '</select> <button class="delete-report-btn" data-report-id="' + r.id + '" onclick="deleteReport(this.dataset.reportId)">Delete Report</button></div></div>'
        + behalfHtml
        + assignmentsHtml;

      document.getElementById('detailModal').classList.add('show');

      // Fetch assignments dynamically
      fetch('/api/reports/' + r.id + '/assignments')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          let html = '<h4 style="margin-bottom:8px">Police Officers Assigned</h4>';
          if (data.length === 0) {
            html += '<p style="color:var(--text-secondary);font-size:13px">No officers assigned yet.</p>';
          } else {
            data.forEach(function(asg) {
              html += '<div style="background:var(--bg-secondary);padding:10px;border-radius:6px;margin:8px 0;font-size:13px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border-soft)">' +
                '<div><strong>' + asg.officerName + '</strong> (' + asg.assignmentType + ')</div>' +
                '<span class="badge" style="background:#3b82f6;color:white;font-size:11px">' + asg.status + '</span>' +
                '</div>';
            });
          }
          document.getElementById('detailAssignments').innerHTML = html;
        });

      // Fetch active officer list for manual assignment dropdown
      fetch('/api/admin/users')
        .then(function(res) { return res.json(); })
        .then(function(users) {
          const officers = users.filter(function(u) { return u.role === 'officer' && u.isActive; });
          if (officers.length === 0) {
            document.getElementById('detailAssignForm').innerHTML = '';
            return;
          }
          let html = '<h4 style="margin-bottom:8px">Assign Officer Manually</h4>' +
            '<div style="display:flex;gap:8px;margin-top:8px">' +
            '<select id="assignOfficerSelect" class="status-select" style="flex:1">';
          officers.forEach(function(o) {
            html += '<option value="' + o.id + '">' + o.name + '</option>';
          });
          html += '</select>' +
            '<button class="admin-action-btn" style="margin:0;padding:6px 12px;font-size:13px" data-report-id="' + r.id + '" onclick="assignOfficer(this.dataset.reportId)">Assign</button>' +
            '</div>';
          document.getElementById('detailAssignForm').innerHTML = html;
        });
    }

    function closeDetail() {
      document.getElementById('detailModal').classList.remove('show');
    }

    document.getElementById('detailModal').addEventListener('click', function(e) {
      if (e.target === this) closeDetail();
    });

    function initRoleRestrictions() {
      const user = window.currentUser || { username: 'admin', role: 'admin' };
      if (user.role === 'viewer') {
        document.body.classList.add('role-viewer');
        document.querySelectorAll('.sidebar-btn').forEach(function(btn) {
          const target = btn.dataset.moduleTarget;
          if (target && !['dashboard', 'reports'].includes(target)) {
            btn.style.display = 'none';
          }
        });
      }
    }
    initTheme();
    initRoleRestrictions();
    loadReports();
    // Auto-refresh periodically while keeping map states if no new data arrives
    setInterval(loadReports, 5000);
  </script>
</body>
</html>`;

// server/admin-store.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_crypto2 = require("crypto");
var storePath = path.resolve(process.cwd(), "server", "data", "admin-management.json");
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var defaultStations = [
  {
    id: "station_boroko",
    name: "Boroko Police Station",
    province: "National Capital District",
    district: "Port Moresby",
    address: "Boroko, Port Moresby, National Capital District",
    latitude: -9.4672,
    longitude: 147.1957,
    commandPhone: "+675 0000 0001",
    commandEmail: "boroko.command@example.gov.pg",
    commanderName: "Station Commander",
    operatingHours: "24/7",
    responseRadiusKm: 15,
    isActive: true,
    notes: "Default station for Port Moresby reports.",
    createdAt: now()
  },
  {
    id: "station_local",
    name: "Local Police Station",
    province: "Papua New Guinea",
    district: "Local District",
    address: "Nearest local police station",
    latitude: -6.314993,
    longitude: 143.95555,
    commandPhone: "+675 0000 0002",
    commandEmail: "local.command@example.gov.pg",
    commanderName: "Duty Commander",
    operatingHours: "24/7",
    responseRadiusKm: 25,
    isActive: true,
    notes: "Fallback local command station.",
    createdAt: now()
  }
];
var defaultData = {
  users: [
    {
      id: "user_admin",
      name: "System Administrator",
      username: "admin",
      role: "admin",
      stationId: null,
      phone: null,
      email: null,
      isActive: true,
      createdAt: now()
    }
  ],
  stations: defaultStations,
  notifications: []
};
function ensureStore() {
  if (fs.existsSync(storePath)) return;
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(defaultData, null, 2));
}
function readStore() {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(storePath, "utf-8"));
  return {
    users: data.users || [],
    stations: data.stations || [],
    notifications: data.notifications || []
  };
}
function writeStore(data) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}
function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function distanceKm(aLat, aLng, bLat, bLng) {
  const toRad = (value) => value * Math.PI / 180;
  const radius = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
var adminStore = {
  listUsers() {
    return readStore().users;
  },
  saveUser(input) {
    const data = readStore();
    const existingIndex = input.id ? data.users.findIndex((item) => item.id === input.id) : -1;
    const user = {
      id: input.id || (0, import_crypto2.randomUUID)(),
      name: String(input.name || "Unnamed User"),
      username: String(input.username || "user"),
      role: input.role || "viewer",
      stationId: input.stationId || null,
      phone: input.phone || null,
      email: input.email || null,
      isActive: input.isActive !== false,
      createdAt: input.createdAt || now()
    };
    if (existingIndex >= 0) data.users[existingIndex] = user;
    else data.users.unshift(user);
    writeStore(data);
    return user;
  },
  listStations() {
    return readStore().stations;
  },
  saveStation(input) {
    const data = readStore();
    const existingIndex = input.id ? data.stations.findIndex((item) => item.id === input.id) : -1;
    const station = {
      id: input.id || (0, import_crypto2.randomUUID)(),
      name: String(input.name || "Unnamed Police Station"),
      province: String(input.province || ""),
      district: String(input.district || ""),
      address: String(input.address || ""),
      latitude: normalizeNumber(input.latitude, 0),
      longitude: normalizeNumber(input.longitude, 0),
      commandPhone: String(input.commandPhone || ""),
      commandEmail: String(input.commandEmail || ""),
      commanderName: String(input.commanderName || ""),
      operatingHours: String(input.operatingHours || "24/7"),
      responseRadiusKm: normalizeNumber(input.responseRadiusKm, 20),
      isActive: input.isActive !== false,
      notes: String(input.notes || ""),
      createdAt: input.createdAt || now()
    };
    if (existingIndex >= 0) data.stations[existingIndex] = station;
    else data.stations.unshift(station);
    writeStore(data);
    return station;
  },
  nearestStation(latitude, longitude) {
    const stations = readStore().stations.filter((station) => station.isActive);
    const nearest = stations.map((station) => {
      const distance = distanceKm(latitude, longitude, station.latitude, station.longitude);
      return {
        ...station,
        distanceKm: Math.round(distance * 10) / 10,
        withinResponseRadius: distance <= station.responseRadiusKm
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm)[0];
    return nearest || null;
  },
  listNotifications() {
    return readStore().notifications;
  },
  createNotification(input) {
    const data = readStore();
    const notification = {
      id: (0, import_crypto2.randomUUID)(),
      stationId: input.stationId || null,
      reportId: input.reportId || null,
      title: String(input.title || "Crime report notification"),
      message: String(input.message || ""),
      channel: input.channel || "console",
      recipient: String(input.recipient || "command"),
      status: "sent",
      createdAt: now()
    };
    data.notifications.unshift(notification);
    data.notifications = data.notifications.slice(0, 200);
    writeStore(data);
    console.log("Police command notification:", notification);
    return notification;
  }
};

// server/cookie-auth.ts
var import_crypto3 = __toESM(require("crypto"));
var SECRET = process.env.JWT_SECRET || "cpng_crime_reporting_png_secret_key_12345";
function signSession(username, role) {
  const payload = `${username}:${role}`;
  const signature = import_crypto3.default.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}:${signature}`;
}
function verifySession(cookieValue) {
  if (!cookieValue) return null;
  const parts = cookieValue.split(":");
  if (parts.length !== 3) return null;
  const [username, role, signature] = parts;
  const payload = `${username}:${role}`;
  const expectedSignature = import_crypto3.default.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (signature === expectedSignature) {
    return {
      username,
      role
    };
  }
  return null;
}

// server/routes.ts
var PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN || "crimewatch.lamtoninvestments.com";
var ADMIN_COOKIE_NAME = "cpng_admin";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.CPNG_ADMIN_PASSWORD || "admin123";
var ADMIN_COOKIE_VALUE = (0, import_node_crypto.createHash)("sha256").update(ADMIN_PASSWORD).digest("hex");
var PASSWORD_ITERATIONS = 21e4;
function hashPassword(password) {
  const salt = (0, import_node_crypto.randomBytes)(16).toString("hex");
  const hash = (0, import_node_crypto.pbkdf2Sync)(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2:${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!stored.startsWith("pbkdf2:")) {
    return stored === password;
  }
  const [, iterationsText, salt, expectedHash] = stored.split(":");
  const iterations = Number(iterationsText);
  if (!iterations || !salt || !expectedHash) return false;
  const actual = (0, import_node_crypto.pbkdf2Sync)(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && (0, import_node_crypto.timingSafeEqual)(actual, expected);
}
function defaultUserPassword(username) {
  const envKey = `CRIMEWATCH_${username.toUpperCase()}_PASSWORD`;
  return process.env[envKey] || (username === "admin" ? ADMIN_PASSWORD : `${username}123`);
}
function sanitizeAdminUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
var uploadsDir = path2.resolve(process.cwd(), "uploads");
var productionReportsCachePath = path2.resolve(process.cwd(), "server", "cache", "production-reports.json");
if (!fs2.existsSync(uploadsDir)) {
  fs2.mkdirSync(uploadsDir, { recursive: true });
}
var upload = (0, import_multer.default)({
  storage: import_multer.default.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path2.extname(file.originalname) || getExtByMime(file.mimetype);
      cb(null, `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`);
    }
  }),
  limits: { fileSize: 200 * 1024 * 1024 }
});
function getExtByMime(mime) {
  if (mime.startsWith("image/")) return ".jpg";
  if (mime.startsWith("video/")) return ".mp4";
  if (mime.startsWith("audio/")) return ".m4a";
  return ".bin";
}
function buildReferenceNumber(report) {
  const submittedAt = report.submittedAt ? new Date(report.submittedAt) : /* @__PURE__ */ new Date();
  const year = Number.isNaN(submittedAt.getTime()) ? (/* @__PURE__ */ new Date()).getUTCFullYear() : submittedAt.getUTCFullYear();
  const shortId = report.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CPNG-${year}-${shortId}`;
}
function withReferenceNumber(report) {
  const fileUrl = report.fileUrl?.startsWith("/uploads/") ? `https://${PRODUCTION_DOMAIN}${report.fileUrl}` : report.fileUrl;
  const tags = Array.isArray(report.tags) ? report.tags : typeof report.tags === "string" && report.tags.length > 0 ? [report.tags] : [];
  return {
    ...report,
    fileUrl,
    tags,
    referenceNumber: buildReferenceNumber(report)
  };
}
async function findNearestDbPoliceStation(latitude, longitude) {
  try {
    const stations = await storage.listPoliceStations({ activeOnly: true });
    const nearest = stations.map((station) => {
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
        withinResponseRadius: distance <= station.responseRadiusKm
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm)[0];
    return nearest || null;
  } catch (error) {
    console.warn("Falling back to JSON police station store:", error);
    return adminStore.nearestStation(latitude, longitude);
  }
}
function isProductionServer(req) {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) return true;
  if (req) {
    const host = req.get("host");
    if (host && (host.includes(PRODUCTION_DOMAIN) || host.includes("lamtoninvestments.com"))) {
      return true;
    }
  }
  return false;
}
async function fetchProductionReports() {
  try {
    const response = await fetch(`https://${PRODUCTION_DOMAIN}/api/reports`, {
      signal: AbortSignal.timeout(2e4)
    });
    if (!response.ok) {
      throw new Error(`Production reports request failed: ${response.status}`);
    }
    const reports = await response.json();
    fs2.mkdirSync(path2.dirname(productionReportsCachePath), { recursive: true });
    fs2.writeFileSync(productionReportsCachePath, JSON.stringify(reports, null, 2));
    return reports;
  } catch (error) {
    if (fs2.existsSync(productionReportsCachePath)) {
      console.warn("Using cached production reports because live fetch failed:", error);
      return JSON.parse(fs2.readFileSync(productionReportsCachePath, "utf-8"));
    }
    throw error;
  }
}
async function patchProductionReportStatus(id, status) {
  const response = await fetch(`https://${PRODUCTION_DOMAIN}/api/reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    throw new Error(`Production status update failed: ${response.status}`);
  }
}
function getCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)])
  );
}
function getSession(req) {
  const cookieVal = getCookies(req.headers.cookie)[ADMIN_COOKIE_NAME];
  if (!cookieVal) return null;
  if (cookieVal === ADMIN_COOKIE_VALUE) {
    return { username: "admin", role: "admin" };
  }
  return verifySession(cookieVal);
}
function isAdminAuthenticated(req) {
  return getSession(req) !== null;
}
function requireAdmin(req, res, next) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ message: "Admin login required" });
  }
  next();
}
function requireAdminWrite(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ message: "Admin login required" });
  }
  if (session.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
  next();
}
function adminLoginHtml(errorMessage = "") {
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
async function forwardToProduction(reportData) {
  try {
    const isProduction = isProductionServer();
    if (isProduction) return;
    const prodUrl = `https://${PRODUCTION_DOMAIN}/api/reports`;
    const response = await fetch(prodUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData)
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
async function forwardFileToProduction(filePath, mimeType, originalName) {
  try {
    const fileBuffer = fs2.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, originalName);
    const prodResponse = await fetch(`https://${PRODUCTION_DOMAIN}/api/upload`, {
      method: "POST",
      body: formData
    });
    if (prodResponse.ok) {
      const data = await prodResponse.json();
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
        isActive: true
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
        isActive: true
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
        isActive: true
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
          radiusKm: 15,
          isActive: true
        });
        console.log("Seeded default officer profile.");
      }
    }
  } catch (err) {
    console.error("Failed to seed default users:", err);
  }
}
async function registerRoutes(app2) {
  await seedDefaultUsers();
  app2.post("/api/admin/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();
    if (username) {
      const user = await storage.getAdminUserByUsername(username);
      if (user && user.isActive && verifyPassword(password, user.passwordHash)) {
        res.setHeader(
          "Set-Cookie",
          `${ADMIN_COOKIE_NAME}=${encodeURIComponent(signSession(user.username, user.role))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
        );
        return res.redirect("/admin");
      }
    } else {
      if (password === ADMIN_PASSWORD) {
        res.setHeader(
          "Set-Cookie",
          `${ADMIN_COOKIE_NAME}=${encodeURIComponent(signSession("admin", "admin"))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
        );
        return res.redirect("/admin");
      }
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(401).send(adminLoginHtml("Incorrect credentials. Please try again."));
  });
  app2.post("/api/admin/logout", (_req, res) => {
    res.setHeader(
      "Set-Cookie",
      `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
    );
    res.redirect("/admin");
  });
  app2.get("/uploads/:filename", (req, res) => {
    if (isProductionServer(req)) {
      return res.status(404).send("File not found on production server");
    }
    res.redirect(302, `https://${PRODUCTION_DOMAIN}/uploads/${encodeURIComponent(req.params.filename)}`);
  });
  app2.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const isProduction = isProductionServer(req);
    if (!isProduction) {
      const prodFileUrl = await forwardFileToProduction(
        req.file.path,
        req.file.mimetype,
        req.file.originalname || `upload${path2.extname(req.file.path)}`
      );
      try {
        fs2.unlinkSync(req.file.path);
      } catch {
      }
      if (prodFileUrl) {
        return res.json({ fileUrl: prodFileUrl });
      }
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  });
  app2.post("/api/reports", async (req, res) => {
    try {
      const latitude = req.body?.latitude !== null && req.body?.latitude !== void 0 ? Number(req.body.latitude) : NaN;
      const longitude = req.body?.longitude !== null && req.body?.longitude !== void 0 ? Number(req.body.longitude) : NaN;
      const nearestStation = Number.isFinite(latitude) && Number.isFinite(longitude) ? await findNearestDbPoliceStation(latitude, longitude) : null;
      const reportData = {
        ...req.body,
        agency: nearestStation?.name || req.body.agency
      };
      const report = await storage.createEvidenceReport(reportData);
      forwardToProduction(reportData);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        try {
          const officers = await storage.listOfficerProfiles();
          for (const officer of officers) {
            if (officer.isActive) {
              const dist = distanceKm(latitude, longitude, officer.latitude, officer.longitude);
              if (dist <= officer.radiusKm) {
                await storage.createReportAssignment({
                  reportId: report.id,
                  officerUserId: officer.userId,
                  assignmentType: "automatic",
                  assignmentReason: `Report coordinates are within ${dist.toFixed(1)} km of officer's coverage area (${officer.radiusKm} km radius).`,
                  matchedAreaName: officer.responsibilityAreaName,
                  status: "Sent to Officer"
                });
                console.log(`Automatically assigned report ${report.id} to officer ${officer.userId}`);
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
            status: "notified"
          });
          await storage.createNotificationLog({
            stationId: nearestStation.id,
            reportId: report.id,
            title: "Immediate crime report dispatch",
            message: "New " + report.priority + " priority " + report.evidenceType + " report near " + nearestStation.name + " (" + nearestStation.distanceKm + " km). Reference: " + buildReferenceNumber(report),
            channel: "console",
            recipient: nearestStation.commandEmail || nearestStation.commandPhone || nearestStation.name,
            status: "sent"
          });
        } catch (notificationError) {
          adminStore.createNotification({
            stationId: nearestStation.id,
            reportId: report.id,
            title: "Immediate crime report dispatch",
            message: "New " + report.priority + " priority " + report.evidenceType + " report near " + nearestStation.name + " (" + nearestStation.distanceKm + " km). Reference: " + buildReferenceNumber(report),
            channel: "console",
            recipient: nearestStation.commandEmail || nearestStation.commandPhone || nearestStation.name
          });
        }
      }
      res.status(201).json({
        ...withReferenceNumber(report),
        nearestStation
      });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });
  app2.get("/api/police-stations", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      res.json(await storage.listPoliceStations({ activeOnly: true }));
    } catch (error) {
      res.json(adminStore.listStations().filter((station) => station.isActive));
    }
  });
  app2.get("/api/police-stations/nearest", async (req, res) => {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required" });
    }
    res.json(await findNearestDbPoliceStation(latitude, longitude));
  });
  app2.get("/api/admin/location/commands", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listPoliceCommands());
  });
  app2.post("/api/admin/location/commands", requireAdminWrite, async (req, res) => {
    res.status(201).json(await storage.createPoliceCommand(req.body));
  });
  app2.get("/api/admin/location/provinces", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listProvinces(req.query.commandId));
  });
  app2.post("/api/admin/location/provinces", requireAdminWrite, async (req, res) => {
    res.status(201).json(await storage.createProvince(req.body));
  });
  app2.get("/api/admin/location/districts", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listDistricts(req.query.provinceId));
  });
  app2.post("/api/admin/location/districts", requireAdminWrite, async (req, res) => {
    res.status(201).json(await storage.createDistrict(req.body));
  });
  app2.get("/api/admin/users", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const users2 = await storage.listAdminUsers();
    res.json(users2.map(sanitizeAdminUser));
  });
  app2.post("/api/admin/users", requireAdminWrite, async (req, res) => {
    const password = String(req.body?.password || req.body?.passwordHash || defaultUserPassword(String(req.body?.username || "user")));
    const created = await storage.createAdminUser({ ...req.body, passwordHash: hashPassword(password) });
    res.status(201).json(sanitizeAdminUser(created));
  });
  app2.get("/api/admin/police-stations", requireAdmin, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listPoliceStations({
      commandId: req.query.commandId,
      provinceId: req.query.provinceId,
      districtId: req.query.districtId
    }));
  });
  app2.post("/api/admin/police-stations", requireAdminWrite, async (req, res) => {
    res.status(201).json(await storage.createPoliceStation(req.body));
  });
  app2.get("/api/admin/deleted-reports", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listDeletedReportAudits());
  });
  app2.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await storage.listNotificationLogs());
  });
  app2.post("/api/admin/notifications", requireAdminWrite, async (req, res) => {
    const notification = await storage.createNotificationLog({
      ...req.body,
      status: "sent"
    });
    res.status(201).json(notification);
  });
  app2.get("/api/reports", requireAdmin, async (_req, res) => {
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
  app2.get("/api/reports/:id", requireAdmin, async (req, res) => {
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
  app2.get("/api/reports/:id/assignments", requireAdmin, async (req, res) => {
    try {
      const list = await storage.listReportAssignments({ reportId: req.params.id });
      const detailed = [];
      const usersList = await storage.listAdminUsers();
      for (const assignment of list) {
        const user = usersList.find((u) => u.id === assignment.officerUserId);
        detailed.push({
          ...assignment,
          officerName: user ? user.name : "Unknown Officer"
        });
      }
      res.json(detailed);
    } catch (error) {
      console.error("Error fetching report assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments." });
    }
  });
  app2.post("/api/admin/reports/:id/assign", requireAdminWrite, async (req, res) => {
    const { id } = req.params;
    const { officerUserId } = req.body;
    try {
      const assignment = await storage.createReportAssignment({
        reportId: id,
        officerUserId,
        assignmentType: "manual",
        assignmentReason: "Assigned manually by dispatcher.",
        status: "Sent to Officer"
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error manual assigning:", error);
      res.status(500).json({ message: "Failed to assign officer." });
    }
  });
  app2.delete("/api/reports/:id", requireAdminWrite, async (req, res) => {
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
        referenceNumber: withReferenceNumber(report).referenceNumber
      });
      res.json({ message: "Report deleted", auditId: audit?.id });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });
  app2.patch("/api/reports/:id/status", requireAdminWrite, async (req, res) => {
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
  app2.post("/api/officer/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "").trim();
    const user = await storage.getAdminUserByUsername(username);
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
    if (user.role !== "officer" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "User is not a police officer." });
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
        responsibilityAreaName: profile?.responsibilityAreaName || "General Coverage Area",
        latitude: profile?.latitude || -9.4438,
        longitude: profile?.longitude || 147.1803,
        radiusKm: profile?.radiusKm || 10
      }
    });
  });
  app2.get("/api/officer/assignments", async (req, res) => {
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
            report: withReferenceNumber(report)
          });
        }
      }
      res.json(detailed);
    } catch (error) {
      console.error("Error listing assignments:", error);
      res.status(500).json({ message: "Failed to list assignments." });
    }
  });
  app2.patch("/api/officer/assignments/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await storage.updateReportAssignmentStatus(id, status);
      const assignments = await storage.listReportAssignments();
      const assignment = assignments.find((a) => a.id === id);
      if (assignment) {
        let reportStatus = "Pending";
        if (status === "Resolved") reportStatus = "Resolved";
        else if (status === "Rejected" || status === "Failed") reportStatus = "Rejected";
        else if (status === "Acknowledged") reportStatus = "Pending";
        else if (status === "On Route") reportStatus = "Pending";
        await storage.updateEvidenceReportStatus(assignment.reportId, reportStatus);
      }
      res.json({ success: true, message: "Assignment status updated." });
    } catch (error) {
      console.error("Error updating assignment status:", error);
      res.status(500).json({ message: "Failed to update assignment status." });
    }
  });
  app2.post("/api/officer/assignments/:id/notes", async (req, res) => {
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
        createdBy: "officer"
      });
      res.json(createdNote);
    } catch (error) {
      console.error("Error creating report note:", error);
      res.status(500).json({ message: "Failed to create report note." });
    }
  });
  app2.get("/api/reports/:id/notes", async (req, res) => {
    try {
      res.json(await storage.listReportNotes(req.params.id));
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  app2.get("/admin", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    const session = getSession(req);
    if (!session) {
      return res.status(200).send(adminLoginHtml());
    }
    const roleScript = `<script>window.currentUser = { username: "${session.username}", role: "${session.role}" };</script>`;
    const responseHtml = adminHtml.replace("<head>", `<head>
  ${roleScript}`);
    res.status(200).send(responseHtml);
  });
  const httpServer = (0, import_node_http.createServer)(app2);
  return httpServer;
}

// server/index.ts
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var app = (0, import_express.default)();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    import_express.default.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(import_express.default.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path4 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path4.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path3.resolve(process.cwd(), "app.json");
    const appJsonContent = fs3.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path3.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs3.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs3.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path3.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs3.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", import_express.default.static(path3.resolve(process.cwd(), "assets")));
  app2.use("/uploads", import_express.default.static(path3.resolve(process.cwd(), "uploads")));
  app2.use(import_express.default.static(path3.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0"
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
