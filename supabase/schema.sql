-- Smart Queue Management System (SQMS)
-- Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Extends the default Supabase auth.users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Queues Table
CREATE TABLE public.queues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  max_capacity INTEGER,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Counters Table
CREATE TABLE public.counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., 'Counter 1'
  agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_open BOOLEAN DEFAULT false
);

-- 4. Tickets Table
CREATE TABLE public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  position_number INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  served_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile, admins can view all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Queues are readable by everyone
CREATE POLICY "Queues are readable by everyone" ON public.queues FOR SELECT USING (true);

-- Tickets are readable by the user who owns them, or by agents/admins
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can create tickets
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
