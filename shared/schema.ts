import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const evidenceReports = pgTable("evidence_reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  evidenceType: text("evidence_type").notNull(),
  incidentType: text("incident_type"),
  description: text("description"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  address: text("address"),
  tags: jsonb("tags").$type<string[]>().default([]),
  agency: text("agency").notNull(),
  priority: text("priority").notNull().default("Medium"),
  isAnonymous: integer("is_anonymous").notNull().default(0),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  reporterName: text("reporter_name"),
  status: text("status").notNull().default("pending"),
  fileUrl: text("file_url"),
  assignedStationId: varchar("assigned_station_id"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const policeCommands = pgTable("police_commands", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  headquarters: text("headquarters"),
  phone: text("phone"),
  email: text("email"),
  commanderName: text("commander_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const provinces = pgTable("provinces", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  commandId: varchar("command_id").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  capital: text("capital"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const districts = pgTable("districts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  provinceId: varchar("province_id").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const policeStations = pgTable("police_stations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  commandId: varchar("command_id").notNull(),
  provinceId: varchar("province_id").notNull(),
  districtId: varchar("district_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  stationType: text("station_type").notNull().default("station"),
  address: text("address"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  commandPhone: text("command_phone"),
  commandEmail: text("command_email"),
  commanderName: text("commander_name"),
  operatingHours: text("operating_hours").notNull().default("24/7"),
  responseRadiusKm: real("response_radius_km").notNull().default(20),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("viewer"),
  commandId: varchar("command_id"),
  provinceId: varchar("province_id"),
  districtId: varchar("district_id"),
  stationId: varchar("station_id"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  stationId: varchar("station_id"),
  reportId: varchar("report_id"),
  userId: varchar("user_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  channel: text("channel").notNull().default("console"),
  recipient: text("recipient").notNull(),
  status: text("status").notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportDispatches = pgTable("report_dispatches", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  stationId: varchar("station_id").notNull(),
  distanceKm: real("distance_km"),
  withinResponseRadius: boolean("within_response_radius").notNull().default(false),
  status: text("status").notNull().default("notified"),
  notifiedAt: timestamp("notified_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deletedReportAudits = pgTable("deleted_report_audits", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  referenceNumber: text("reference_number"),
  reason: text("reason").notNull(),
  deletedBy: text("deleted_by").notNull().default("admin"),
  reportSnapshot: jsonb("report_snapshot").$type<Record<string, unknown>>().notNull(),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEvidenceReportSchema = createInsertSchema(evidenceReports).omit({
  id: true,
  submittedAt: true,
});

export const insertPoliceCommandSchema = createInsertSchema(policeCommands).omit({ id: true, createdAt: true });
export const insertProvinceSchema = createInsertSchema(provinces).omit({ id: true, createdAt: true });
export const insertDistrictSchema = createInsertSchema(districts).omit({ id: true, createdAt: true });
export const insertPoliceStationSchema = createInsertSchema(policeStations).omit({ id: true, createdAt: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });
export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({ id: true, createdAt: true });
export const insertReportDispatchSchema = createInsertSchema(reportDispatches).omit({ id: true, createdAt: true });
export const insertDeletedReportAuditSchema = createInsertSchema(deletedReportAudits).omit({ id: true, deletedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EvidenceReport = typeof evidenceReports.$inferSelect;
export type InsertEvidenceReport = z.infer<typeof insertEvidenceReportSchema>;
export type PoliceCommand = typeof policeCommands.$inferSelect;
export type Province = typeof provinces.$inferSelect;
export type District = typeof districts.$inferSelect;
export type PoliceStation = typeof policeStations.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type ReportDispatch = typeof reportDispatches.$inferSelect;
export type DeletedReportAudit = typeof deletedReportAudits.$inferSelect;
export type InsertPoliceCommand = z.infer<typeof insertPoliceCommandSchema>;
export type InsertProvince = z.infer<typeof insertProvinceSchema>;
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type InsertPoliceStation = z.infer<typeof insertPoliceStationSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type InsertReportDispatch = z.infer<typeof insertReportDispatchSchema>;
export type InsertDeletedReportAudit = z.infer<typeof insertDeletedReportAuditSchema>;
