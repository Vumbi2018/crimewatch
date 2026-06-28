import fs from "node:fs";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const filePath = process.argv[2];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Run: set -a; source .env; set +a");
  process.exit(1);
}

if (!filePath) {
  console.error("Usage: node scripts/import-evidence-reports.mjs <reports.json>");
  process.exit(1);
}

const raw = fs.readFileSync(filePath, "utf8");
const reports = JSON.parse(raw);

if (!Array.isArray(reports)) {
  console.error("Expected a JSON array of evidence reports.");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const sql = `INSERT INTO evidence_reports (
  id,
  evidence_type,
  incident_type,
  description,
  latitude,
  longitude,
  address,
  tags,
  agency,
  priority,
  is_anonymous,
  contact_phone,
  contact_email,
  reporter_name,
  status,
  file_url,
  assigned_station_id,
  submitted_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
) ON CONFLICT (id) DO UPDATE SET
  evidence_type = EXCLUDED.evidence_type,
  incident_type = EXCLUDED.incident_type,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  address = EXCLUDED.address,
  tags = EXCLUDED.tags,
  agency = EXCLUDED.agency,
  priority = EXCLUDED.priority,
  is_anonymous = EXCLUDED.is_anonymous,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  reporter_name = EXCLUDED.reporter_name,
  status = EXCLUDED.status,
  file_url = EXCLUDED.file_url,
  assigned_station_id = EXCLUDED.assigned_station_id,
  submitted_at = EXCLUDED.submitted_at`;

let imported = 0;
for (const report of reports) {
  await client.query(sql, [
    report.id,
    report.evidenceType || report.evidence_type || "photo",
    report.incidentType ?? report.incident_type ?? null,
    report.description ?? null,
    report.latitude ?? null,
    report.longitude ?? null,
    report.address ?? null,
    JSON.stringify(report.tags || []),
    report.agency || "NCD Command Centre",
    report.priority || "Medium",
    Number(report.isAnonymous ?? report.is_anonymous ?? 0),
    report.contactPhone ?? report.contact_phone ?? null,
    report.contactEmail ?? report.contact_email ?? null,
    report.reporterName ?? report.reporter_name ?? "Anonymous User",
    report.status || "new",
    report.fileUrl ?? report.file_url ?? null,
    report.assignedStationId ?? report.assigned_station_id ?? null,
    report.submittedAt ?? report.submitted_at ?? new Date().toISOString(),
  ]);
  imported += 1;
}

await client.end();
console.log(`Upserted ${imported} evidence reports.`);
