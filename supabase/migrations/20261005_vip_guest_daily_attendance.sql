CREATE TABLE IF NOT EXISTS public.vip_guest_attendance (
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  host_ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_day TEXT NOT NULL CHECK (event_day IN ('day1', 'day2', 'day3')),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gate_id UUID REFERENCES public.gates(id) ON DELETE SET NULL,
  PRIMARY KEY (ticket_id, event_day)
);

CREATE INDEX IF NOT EXISTS idx_vip_guest_attendance_host_day
  ON public.vip_guest_attendance (host_ticket_id, event_day);

ALTER TABLE public.vip_guest_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view VIP guest attendance" ON public.vip_guest_attendance;
CREATE POLICY "Authenticated users can view VIP guest attendance"
  ON public.vip_guest_attendance FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.atomic_checkin_vip_guest(
  p_ticket_code TEXT,
  p_gate_id UUID,
  p_checked_in_under_ticket_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.tickets%ROWTYPE;
  v_host public.tickets%ROWTYPE;
  v_result JSONB;
  v_event_day TEXT;
  v_today DATE := (NOW() AT TIME ZONE 'Africa/Lagos')::DATE;
BEGIN
  SELECT * INTO v_guest
  FROM public.tickets
  WHERE UPPER(ticket_code) = UPPER(TRIM(COALESCE(p_ticket_code, '')))
  FOR UPDATE;

  IF NOT FOUND OR v_guest.parent_ticket_id IS NULL
     OR v_guest.parent_ticket_id <> p_checked_in_under_ticket_id THEN
    RETURN jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Guest pass does not belong to the selected VIP host.');
  END IF;

  SELECT * INTO v_host FROM public.tickets WHERE id = p_checked_in_under_ticket_id;
  IF NOT FOUND OR v_host.parent_ticket_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'VIP host pass was not found.');
  END IF;

  IF v_guest.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'status', 'REVOKED', 'data', to_jsonb(v_guest), 'message', 'Guest pass has been revoked.');
  END IF;

  v_event_day := CASE v_today
    WHEN DATE '2026-11-21' THEN 'day1'
    WHEN DATE '2026-11-22' THEN 'day2'
    WHEN DATE '2026-11-23' THEN 'day3'
    ELSE 'day1'
  END;

  IF EXISTS (
    SELECT 1 FROM public.vip_guest_attendance a
    WHERE a.ticket_id = v_guest.id AND a.event_day = v_event_day
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'DUPLICATE',
      'data', to_jsonb(v_guest),
      'message', 'This guest pass was already scanned for ' || UPPER(v_event_day) || '.'
    );
  END IF;

  INSERT INTO public.vip_guest_attendance (ticket_id, host_ticket_id, event_day, scanned_at, scanned_by, gate_id)
  VALUES (v_guest.id, v_host.id, v_event_day, NOW(), auth.uid(), p_gate_id);

  UPDATE public.tickets
  SET status = 'used',
      scanned_at = NOW(),
      scanned_by = auth.uid(),
      gate_id_scanned_at = p_gate_id,
      checked_in_under_ticket_id = v_host.id,
      updated_at = NOW()
  WHERE id = v_guest.id
  RETURNING * INTO v_guest;

  v_result := jsonb_build_object(
    'success', true,
    'status', 'VALID',
    'data', to_jsonb(v_guest),
    'message', 'VALID GUEST ENTRY (' || UPPER(v_event_day) || ') UNDER VIP HOST.'
  );
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.atomic_checkin_vip_guest(TEXT, UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atomic_checkin_vip_guest(TEXT, UUID, UUID)
  TO authenticated;
