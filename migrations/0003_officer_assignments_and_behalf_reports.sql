ALTER TABLE evidence_reports
  ADD COLUMN IF NOT EXISTS is_behalf_report boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS behalf_name text,
  ADD COLUMN IF NOT EXISTS behalf_contact text,
  ADD COLUMN IF NOT EXISTS behalf_relationship text,
  ADD COLUMN IF NOT EXISTS behalf_consent boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS behalf_source text,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

ALTER TABLE evidence_reports
  ALTER COLUMN status SET DEFAULT 'New';

CREATE TABLE IF NOT EXISTS officer_profiles (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id varchar NOT NULL,
  rank text NOT NULL,
  station_id varchar,
  responsibility_area_name text NOT NULL,
  latitude real NOT NULL,
  longitude real NOT NULL,
  radius_km real DEFAULT 10 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS report_assignments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  report_id varchar NOT NULL,
  officer_user_id varchar NOT NULL,
  assignment_type text DEFAULT 'automatic' NOT NULL,
  assignment_reason text,
  matched_area_name text,
  status text DEFAULT 'Sent to Officer' NOT NULL,
  sent_at timestamp DEFAULT now() NOT NULL,
  acknowledged_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS report_notes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  report_id varchar NOT NULL,
  note_type text DEFAULT 'general' NOT NULL,
  note text NOT NULL,
  created_by text DEFAULT 'system' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);