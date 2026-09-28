-- Migration: 01_init.sql
-- Enterprise Box-Office Schema for National Livestock Festival

-- 1. ENUMs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_roles') THEN
    CREATE TYPE public.user_roles AS ENUM ('admin', 'gatekeeper', 'security', 'team_member', 'attendee', 'user');
  ELSE
    ALTER TYPE public.user_roles ADD VALUE IF NOT EXISTS 'team_member';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_tier') THEN
    CREATE TYPE public.ticket_tier AS ENUM ('general', 'vip_1', 'vip_2', 'vip_3');
  END IF;
END $$;

-- Drop legacy tickets table if it exists with old schema
DROP TABLE IF EXISTS public.tickets CASCADE;

-- 2. Gates Table
CREATE TABLE IF NOT EXISTS public.gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Gates
INSERT INTO public.gates (id, name, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Gate 1 - Main North Entrance', 'Main entrance for general attendees'),
  ('22222222-2222-2222-2222-222222222222', 'Gate 2 - VIP West Dignitary Gate', 'Exclusive entrance for VIP 1, 2, and 3 delegates'),
  ('33333333-3333-3333-3333-333333333333', 'Gate 3 - East Grandstand Access', 'Grandstand and exhibitor access'),
  ('44444444-4444-4444-4444-444444444444', 'Gate 4 - Livestock Exhibition Ring', 'Exhibition ring and staff entrance')
ON CONFLICT (id) DO NOTHING;

-- 3. Custom Roles / Groups Table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('staff', 'attendee')),
  wristband_color TEXT DEFAULT 'Emerald Green',
  wristband_hex TEXT DEFAULT '#0F4A2F',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default custom_roles
INSERT INTO public.custom_roles (name, category, wristband_color, wristband_hex)
VALUES
  ('Admin', 'staff', 'Obsidian Platinum', '#0F172A'),
  ('Director', 'staff', 'Champagne Gold', '#D97706'),
  ('Tech Support', 'staff', 'Cobalt Blue', '#2563EB'),
  ('Gatekeeper', 'staff', 'Emerald Green', '#0F4A2F'),
  ('Security', 'staff', 'Crimson Red', '#DC2626'),
  ('Creatives', 'staff', 'Royal Purple', '#7E22CE'),
  ('Team Member', 'staff', 'Cobalt Blue', '#2563EB'),
  ('Attendee', 'attendee', 'Emerald Green', '#0F4A2F'),
  ('Vendors', 'attendee', 'Tangerine Orange', '#EA580C'),
  ('Exhibitors', 'attendee', 'Royal Purple', '#7E22CE'),
  ('VIP Tier 1', 'attendee', 'Metallic Silver', '#64748B'),
  ('VIP Tier 2', 'attendee', 'Champagne Gold', '#D97706'),
  ('VIP Tier 3', 'attendee', 'Obsidian Platinum', '#0F172A')
ON CONFLICT (name) DO NOTHING;

-- 4. Profiles Table (Supports custom role names as TEXT)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  assigned_gate_id UUID REFERENCES public.gates(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert column type if created previously as ENUM
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Tickets Table (Enterprise Box-Office Schema)
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.ticket_tier NOT NULL DEFAULT 'general'::public.ticket_tier,
  parent_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'revoked')),
  scanned_at TIMESTAMPTZ,
  gate_id_scanned_at UUID REFERENCES public.gates(id) ON DELETE SET NULL,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets (ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_owner_id ON public.tickets (owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_parent_id ON public.tickets (parent_ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Enable RLS
ALTER TABLE public.gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Custom Roles RLS Policies
DROP POLICY IF EXISTS "Allow ALL custom_roles" ON public.custom_roles;
CREATE POLICY "Allow ALL custom_roles"
  ON public.custom_roles FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Gates RLS Policies
DROP POLICY IF EXISTS "Allow ALL gates" ON public.gates;
CREATE POLICY "Allow ALL gates"
  ON public.gates FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Allow ALL profiles" ON public.profiles;
CREATE POLICY "Allow ALL profiles"
  ON public.profiles FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Tickets RLS Policies
DROP POLICY IF EXISTS "Allow SELECT tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow INSERT tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow UPDATE tickets" ON public.tickets;

CREATE POLICY "Allow SELECT tickets"
  ON public.tickets FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow INSERT tickets"
  ON public.tickets FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow UPDATE tickets"
  ON public.tickets FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 6. Trigger on auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    CASE
      WHEN LOWER(NEW.email) IN ('admin@livestockcarnival.ng', 'admin@gcc.com') THEN 'admin'
      WHEN LOWER(NEW.email) LIKE 'qrscanner%' THEN 'gatekeeper'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Atomic Checkin PL/pgSQL RPC Stored Procedure
CREATE OR REPLACE FUNCTION public.atomic_checkin(
  p_ticket_code TEXT,
  p_gate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_caller_id UUID := auth.uid();
  v_updated_ticket RECORD;
BEGIN
  p_ticket_code := UPPER(TRIM(COALESCE(p_ticket_code, '')));

  IF p_ticket_code = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'INVALID',
      'message', 'No ticket code provided.'
    );
  END IF;

  -- 1. Query ticket with FOR UPDATE row locking
  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE UPPER(ticket_code) = p_ticket_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'INVALID',
      'code', p_ticket_code,
      'message', 'INVALID TICKET CODE: No registration record found in festival registry.'
    );
  END IF;

  -- Guard 1: Revoked Ticket Check
  IF v_ticket.status = 'revoked' THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'REVOKED',
      'data', to_jsonb(v_ticket),
      'message', 'FLAGGED: ACCESS REVOKED. Entry privileges have been administratively suspended. Do NOT admit.'
    );
  END IF;

  -- Guard 2: Already Used / Duplicate Check
  IF v_ticket.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'DUPLICATE',
      'data', to_jsonb(v_ticket),
      'message', 'FLAGGED: TICKET ALREADY USED. Admitted at ' || COALESCE(TO_CHAR(v_ticket.scanned_at, 'HH24:MI:SS'), 'earlier') || '. Hand wristband only once.'
    );
  END IF;

  -- Guard 3: Perform Check-In
  UPDATE public.tickets
  SET
    status = 'used',
    scanned_at = v_now,
    gate_id_scanned_at = p_gate_id,
    scanned_by = v_caller_id,
    updated_at = v_now
  WHERE id = v_ticket.id
  RETURNING * INTO v_updated_ticket;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'VALID',
    'data', to_jsonb(v_updated_ticket),
    'message', 'VALID ENTRY (' || UPPER(v_ticket.tier::text) || '): Admit attendee and issue appropriate wristband.'
  );
END;
$$;

-- 8. Sync Scan Event RPC
CREATE OR REPLACE FUNCTION public.sync_scan_event(
  p_operation_id TEXT,
  p_ticket_id TEXT,
  p_uid TEXT,
  p_gate_id UUID,
  p_timestamp TIMESTAMPTZ,
  p_event_day TEXT,
  p_source TEXT DEFAULT 'OFFLINE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res JSONB;
BEGIN
  v_res := public.atomic_checkin(p_ticket_id, p_gate_id);
  RETURN v_res;
END;
$$;
