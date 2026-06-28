CREATE TABLE IF NOT EXISTS deleted_report_audits (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id varchar NOT NULL,
  reference_number text,
  reason text NOT NULL,
  deleted_by text NOT NULL DEFAULT 'admin',
  report_snapshot jsonb NOT NULL,
  deleted_at timestamp NOT NULL DEFAULT now()
);
