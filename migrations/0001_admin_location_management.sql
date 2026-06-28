CREATE TABLE IF NOT EXISTS police_commands (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  headquarters text,
  phone text,
  email text,
  commander_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provinces (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id varchar NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  capital text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS districts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id varchar NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS police_stations (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id varchar NOT NULL,
  province_id varchar NOT NULL,
  district_id varchar NOT NULL,
  name text NOT NULL,
  code text,
  station_type text NOT NULL DEFAULT 'station',
  address text,
  latitude real NOT NULL,
  longitude real NOT NULL,
  command_phone text,
  command_email text,
  commander_name text,
  operating_hours text NOT NULL DEFAULT '24/7',
  response_radius_km real NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  password_hash text,
  role text NOT NULL DEFAULT 'viewer',
  command_id varchar,
  province_id varchar,
  district_id varchar,
  station_id varchar,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id varchar,
  report_id varchar,
  user_id varchar,
  title text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL DEFAULT 'console',
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  provider_message_id text,
  error_message text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_dispatches (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id varchar NOT NULL,
  station_id varchar NOT NULL,
  distance_km real,
  within_response_radius boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'notified',
  notified_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE evidence_reports ADD COLUMN IF NOT EXISTS assigned_station_id varchar;

CREATE INDEX IF NOT EXISTS idx_provinces_command_id ON provinces(command_id);
CREATE INDEX IF NOT EXISTS idx_districts_province_id ON districts(province_id);
CREATE INDEX IF NOT EXISTS idx_police_stations_command_id ON police_stations(command_id);
CREATE INDEX IF NOT EXISTS idx_police_stations_province_id ON police_stations(province_id);
CREATE INDEX IF NOT EXISTS idx_police_stations_district_id ON police_stations(district_id);
CREATE INDEX IF NOT EXISTS idx_police_stations_active ON police_stations(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_station_id ON admin_users(station_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_station_id ON notification_logs(station_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_report_id ON notification_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_dispatches_report_id ON report_dispatches(report_id);
CREATE INDEX IF NOT EXISTS idx_report_dispatches_station_id ON report_dispatches(station_id);
