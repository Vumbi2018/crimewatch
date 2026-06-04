import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEvidenceReportSchema = createInsertSchema(evidenceReports).omit({
  id: true,
  submittedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EvidenceReport = typeof evidenceReports.$inferSelect;
export type InsertEvidenceReport = z.infer<typeof insertEvidenceReportSchema>;
