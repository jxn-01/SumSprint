-- Supabase policy setup for the `attempts` table
-- Run this in Supabase SQL editor using a service_role key or from the Supabase dashboard.

-- Enable row-level security for the table (if not already enabled).
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts so the app can save attempts.
CREATE POLICY "Allow anon insert" ON public.attempts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous selects so the admin dashboard can query attempt data.
CREATE POLICY "Allow anon select" ON public.attempts
  FOR SELECT
  TO anon
  USING (true);
