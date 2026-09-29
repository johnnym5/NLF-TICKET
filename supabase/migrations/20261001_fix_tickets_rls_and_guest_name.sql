-- Migration: Fix tickets RLS and guest_name column persistence
-- Ensures guest_name and parent_ticket_id columns exist and RLS permits updates/inserts for authenticated and anon users

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS parent_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop conflicting RLS policies
DROP POLICY IF EXISTS "Block direct UPDATE on tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated SELECT on tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon SELECT on tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow INSERT for registration" ON public.tickets;
DROP POLICY IF EXISTS "Allow ALL tickets" ON public.tickets;

-- Create unified permissive policy on tickets
CREATE POLICY "Allow ALL tickets"
  ON public.tickets FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);
