-- Temporarily allow inserts/updates for anonymous roles during the frontend prototype phase.
-- Once User Authentication is fully integrated, these should be restricted to `auth.role() = 'authenticated'`

CREATE POLICY "Queues are insertable by everyone" ON public.queues FOR INSERT WITH CHECK (true);
CREATE POLICY "Queues are updatable by everyone" ON public.queues FOR UPDATE USING (true);
