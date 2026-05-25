-- Seed data for SQMS

-- 1. Create a dummy admin user (You can bypass this if you already signed up via the UI)
-- NOTE: Due to Supabase Auth restrictions, it's better to create users via the Auth API, 
-- but we can insert a dummy queue directly without an admin_id for testing purposes.

-- 2. Insert dummy queues
INSERT INTO public.queues (id, name, location, is_active, max_capacity)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Main Branch - Tellers', 'Downtown HQ', true, 100),
  ('22222222-2222-2222-2222-222222222222', 'Customer Support', 'Floor 2', true, 50)
ON CONFLICT DO NOTHING;

-- 3. Insert dummy counters
INSERT INTO public.counters (queue_id, name, is_open)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Counter 1', true),
  ('11111111-1111-1111-1111-111111111111', 'Counter 2', true),
  ('22222222-2222-2222-2222-222222222222', 'Support Desk A', true)
ON CONFLICT DO NOTHING;
