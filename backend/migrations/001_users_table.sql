-- FT-TRMS Database Schema Migration 001
-- Creates core tables for users, assignments, and system settings

-- Ensure pgcrypto is available for `gen_random_uuid()` used in later migrations
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Users Table ──────────────────────────────────────────────────────────────
-- Extends Supabase Auth users with app-specific fields.
-- The id column references auth.users(id) so every row maps to a Supabase Auth user.

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'EMPLOYEE'
                CHECK (role IN ('EMPLOYEE', 'MANAGER', 'ADMIN', 'ACCOUNTANT')),
  phone         TEXT,
  rate_per_km   NUMERIC(8,2) DEFAULT 10.00,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ─── Employee-Manager Assignments ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.employee_manager_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT unique_active_assignment UNIQUE (employee_id, active)
);

CREATE INDEX IF NOT EXISTS idx_ema_employee ON public.employee_manager_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_ema_manager ON public.employee_manager_assignments(manager_id);

-- ─── System Settings ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID REFERENCES public.users(id)
);

-- Seed default settings
INSERT INTO public.system_settings (key, value) VALUES
  ('global_rate_per_km', '10.00'),
  ('max_speed_kmh', '200'),
  ('gps_interval_sec', '15'),
  ('max_accuracy_m', '150'),
  ('max_jump_km', '50')
ON CONFLICT (key) DO NOTHING;

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_self_read ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Service role can do everything (backend API uses service role key)
CREATE POLICY users_service_all ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY ema_service_all ON public.employee_manager_assignments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY settings_service_all ON public.system_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read system settings
CREATE POLICY settings_authenticated_read ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── Auto-create users row on signup (trigger) ───────────────────────────────
-- When a user signs up via Supabase Auth, automatically insert a row into
-- public.users using their metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'EMPLOYEE')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists, then re-create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
