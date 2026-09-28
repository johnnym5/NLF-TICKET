-- Migration: Initialize schema for NLF Tickets
-- Migration Date: 2026-09-28

-- 1. Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  "ticketCode" TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'REGULAR',
  "wristbandColor" TEXT NOT NULL DEFAULT 'Emerald Green',
  status TEXT NOT NULL DEFAULT 'REGISTERED',
  "accessRevoked" BOOLEAN NOT NULL DEFAULT FALSE,
  "daysAttended" JSONB NOT NULL DEFAULT '{"day1": false, "day2": false, "day3": false}'::jsonb,
  "checkedInAt" TEXT,
  "checkedInFullDate" TIMESTAMPTZ,
  "checkedInBy" TEXT,
  "referralSource" TEXT,
  role TEXT DEFAULT 'attendee',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create vip_invitations table for VIP dispatch links
CREATE TABLE IF NOT EXISTS public.vip_invitations (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'VIP_GOLD',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "isUsed" BOOLEAN NOT NULL DEFAULT FALSE,
  "usedBy" TEXT,
  "createdBy" TEXT
);

-- Index for fast lookup on ticketCode and uid
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets ("ticketCode");
CREATE INDEX IF NOT EXISTS idx_tickets_uid ON public.tickets (uid);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets (Drop if exists for idempotency)
DROP POLICY IF EXISTS "Allow authenticated SELECT on tickets" ON public.tickets;
CREATE POLICY "Allow authenticated SELECT on tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon SELECT on tickets" ON public.tickets;
CREATE POLICY "Allow anon SELECT on tickets"
  ON public.tickets
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow INSERT for registration" ON public.tickets;
CREATE POLICY "Allow INSERT for registration"
  ON public.tickets
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Block direct UPDATE on tickets" ON public.tickets;
CREATE POLICY "Block direct UPDATE on tickets"
  ON public.tickets
  FOR UPDATE
  USING (false);

-- RLS Policies for vip_invitations
DROP POLICY IF EXISTS "Allow ALL on vip_invitations for authenticated" ON public.vip_invitations;
CREATE POLICY "Allow ALL on vip_invitations for authenticated"
  ON public.vip_invitations
  FOR ALL
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow SELECT on vip_invitations for anon" ON public.vip_invitations;
CREATE POLICY "Allow SELECT on vip_invitations for anon"
  ON public.vip_invitations
  FOR SELECT
  TO anon
  USING (true);

-- 3. Atomic Checkin PL/pgSQL Stored Procedure with FOR UPDATE Row Locking
CREATE OR REPLACE FUNCTION public.atomic_checkin(
  p_ticket_code TEXT,
  p_gate_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_today_str TEXT;
  v_current_day TEXT;
  v_days_attended JSONB;
  v_day_num TEXT;
  v_scanned_count INT;
  v_scan_time TEXT;
  v_scan_full_date TIMESTAMPTZ;
  v_wristband_color TEXT;
  v_updated_ticket RECORD;
  v_last_check_in TIMESTAMPTZ;
  v_hours_since FLOAT;
BEGIN
  -- Trim and uppercase input ticket code
  p_ticket_code := UPPER(TRIM(COALESCE(p_ticket_code, '')));

  IF p_ticket_code = '' THEN
    RETURN jsonb_build_object(
      'status', 'INVALID',
      'message', 'No ticket code provided.'
    );
  END IF;

  -- 1. Query ticket with FOR UPDATE row locking
  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE UPPER("ticketCode") = p_ticket_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'INVALID',
      'code', p_ticket_code,
      'message', 'INVALID TICKET CODE: No registration record found in festival registry.'
    );
  END IF;

  v_wristband_color := COALESCE(v_ticket."wristbandColor", 'Emerald Green');

  -- Guard 1: Immediate Access Revocation Check
  IF v_ticket."accessRevoked" = TRUE THEN
    RETURN jsonb_build_object(
      'status', 'REVOKED',
      'data', to_jsonb(v_ticket),
      'wristbandColor', v_wristband_color,
      'message', 'FLAGGED: ACCESS REVOKED. Entry privileges for ' || v_ticket."fullName" || ' have been administratively suspended. Do NOT admit.'
    );
  END IF;

  -- Derive festival day based on date
  v_today_str := TO_CHAR(v_now AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD');
  IF v_today_str = '2026-11-21' THEN
    v_current_day := 'day1';
    v_day_num := '1';
  ELSIF v_today_str = '2026-11-22' THEN
    v_current_day := 'day2';
    v_day_num := '2';
  ELSIF v_today_str = '2026-11-23' THEN
    v_current_day := 'day3';
    v_day_num := '3';
  ELSE
    v_current_day := 'day1';
    v_day_num := '1';
  END IF;

  v_days_attended := COALESCE(v_ticket."daysAttended", '{"day1": false, "day2": false, "day3": false}'::jsonb);

  -- Guard 2: Same-day Duplicate Admittance Check
  IF v_ticket."checkedInFullDate" IS NOT NULL THEN
    v_last_check_in := v_ticket."checkedInFullDate";
    v_hours_since := EXTRACT(EPOCH FROM (v_now - v_last_check_in)) / 3600.0;

    IF COALESCE((v_days_attended->>v_current_day)::boolean, false) = TRUE AND v_hours_since < 24.0 THEN
      RETURN jsonb_build_object(
        'status', 'DUPLICATE',
        'data', to_jsonb(v_ticket),
        'wristbandColor', v_wristband_color,
        'message', 'FLAGGED: PASS ALREADY SCANNED TODAY. Admitted at ' || COALESCE(v_ticket."checkedInAt", 'earlier today') || ' by ' || COALESCE(v_ticket."checkedInBy", 'Gate') || '. Hand wristband only once per day.'
      );
    END IF;
  END IF;

  -- Perform Atomic Check-In
  v_scan_time := TO_CHAR(v_now AT TIME ZONE 'Africa/Lagos', 'HH24:MI:SS');
  v_scan_full_date := v_now;
  v_days_attended := jsonb_set(v_days_attended, ARRAY[v_current_day], 'true'::jsonb);

  SELECT COUNT(*) INTO v_scanned_count
  FROM (
    SELECT jsonb_object_keys(v_days_attended) AS k
  ) sub
  WHERE (v_days_attended->>k)::boolean = TRUE;

  UPDATE public.tickets
  SET
    status = 'CHECKED_IN',
    "checkedInAt" = v_scan_time,
    "checkedInFullDate" = v_scan_full_date,
    "checkedInBy" = p_gate_name,
    "daysAttended" = v_days_attended,
    "updatedAt" = v_now
  WHERE id = v_ticket.id
  RETURNING * INTO v_updated_ticket;

  RETURN jsonb_build_object(
    'status', 'VALID',
    'data', to_jsonb(v_updated_ticket),
    'wristbandColor', v_wristband_color,
    'message', 'VALID ENTRY (Day ' || v_day_num || '): Issue ' || UPPER(v_wristband_color) || ' Wristband to ' || v_ticket."fullName" || ' [Attendance: ' || v_scanned_count || ' of 3 Days]'
  );
END;
$$;

-- 4. Sync Scan Event PL/pgSQL Stored Procedure
CREATE OR REPLACE FUNCTION public.sync_scan_event(
  p_operation_id TEXT,
  p_ticket_id TEXT,
  p_uid TEXT,
  p_gate_id TEXT,
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
  RETURN jsonb_build_object(
    'success', (v_res->>'status' = 'VALID' OR v_res->>'status' = 'DUPLICATE'),
    'status', v_res->>'status',
    'message', v_res->>'message',
    'data', v_res->'data'
  );
END;
$$;
