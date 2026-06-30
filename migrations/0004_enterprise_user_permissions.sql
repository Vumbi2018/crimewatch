ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS permission_profile text DEFAULT 'viewer' NOT NULL,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mfa_required boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;

UPDATE admin_users
SET permission_profile = CASE
  WHEN role = 'admin' THEN 'super_admin'
  WHEN role = 'commander' THEN 'command_lead'
  WHEN role = 'dispatcher' THEN 'dispatcher'
  WHEN role = 'officer' THEN 'field_officer'
  ELSE 'viewer'
END
WHERE permission_profile IS NULL OR permission_profile = 'viewer';