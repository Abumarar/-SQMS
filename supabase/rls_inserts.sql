-- Temporarily allow inserts/updates for anonymous roles during the frontend prototype phase.
-- Once User Authentication is fully integrated, these should be restricted to `auth.role() = 'authenticated'`

CREATE POLICY "Queues are insertable by everyone" ON public.queues FOR INSERT WITH CHECK (true);
CREATE POLICY "Queues are updatable by everyone" ON public.queues FOR UPDATE USING (true);

-- Allow anonymous users to interact with tickets in prototype phase
CREATE POLICY "Tickets are readable by everyone" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Tickets are insertable by everyone" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Tickets are updatable by everyone" ON public.tickets FOR UPDATE USING (true);
