-- Run this to grant the API roles access to the tables we created
-- This is necessary because we disabled "Automatically expose new tables" for security.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queues TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counters TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO anon, authenticated;

-- Also grant usage on the schema and sequences (best practice)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
