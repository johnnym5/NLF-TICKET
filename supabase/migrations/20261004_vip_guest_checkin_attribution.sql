ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS checked_in_under_ticket_id UUID
  REFERENCES public.tickets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_checked_in_under_ticket
  ON public.tickets (checked_in_under_ticket_id)
  WHERE checked_in_under_ticket_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.atomic_checkin_vip_guest(
  p_ticket_code TEXT,
  p_gate_id UUID,
  p_checked_in_under_ticket_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest public.tickets%ROWTYPE;
  v_host public.tickets%ROWTYPE;
  v_result JSONB;
  v_updated public.tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_guest
  FROM public.tickets
  WHERE UPPER(ticket_code) = UPPER(TRIM(COALESCE(p_ticket_code, '')));

  IF NOT FOUND OR v_guest.parent_ticket_id IS NULL
     OR v_guest.parent_ticket_id <> p_checked_in_under_ticket_id THEN
    RETURN jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Guest pass does not belong to the selected VIP host.');
  END IF;

  SELECT * INTO v_host FROM public.tickets WHERE id = p_checked_in_under_ticket_id;
  IF NOT FOUND OR v_host.parent_ticket_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'VIP host pass was not found.');
  END IF;

  v_result := public.atomic_checkin(p_ticket_code, p_gate_id);

  IF COALESCE((v_result->>'success')::BOOLEAN, false) OR v_result->>'status' = 'VALID' THEN
    UPDATE public.tickets
    SET checked_in_under_ticket_id = p_checked_in_under_ticket_id
    WHERE id = v_guest.id
    RETURNING * INTO v_updated;
    v_result := jsonb_set(v_result, '{data}', to_jsonb(v_updated));
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.atomic_checkin_vip_guest(TEXT, UUID, UUID)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.atomic_checkin_vip_guest(TEXT, UUID, UUID)
  TO authenticated;
