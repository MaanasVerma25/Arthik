-- ============================================================
-- Arthik: Consolidated Database Schema (Final)
-- Run this in Supabase SQL Editor.
-- Safe to run on existing databases (uses IF NOT EXISTS everywhere).
-- Preserves all existing user data.
-- ============================================================


-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT DEFAULT '',
    role TEXT DEFAULT 'Student',
    city TEXT DEFAULT '',
    balance NUMERIC DEFAULT 100000,
    is_pro BOOLEAN DEFAULT false,
    stock_holdings JSONB DEFAULT '[]'::jsonb,
    forex_holdings JSONB DEFAULT '[]'::jsonb,
    crypto_holdings JSONB DEFAULT '[]'::jsonb,
    financial_ambition TEXT DEFAULT '',
    monthly_salary NUMERIC DEFAULT 0,
    field_of_work TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add columns that may be missing on existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN balance TYPE NUMERIC;
ALTER TABLE public.profiles ALTER COLUMN balance SET DEFAULT 100000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stock_holdings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS forex_holdings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crypto_holdings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS financial_ambition TEXT DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN monthly_salary TYPE NUMERIC;
ALTER TABLE public.profiles ALTER COLUMN monthly_salary SET DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS field_of_work TEXT DEFAULT '';

-- Set default balance to 100000 for new users
ALTER TABLE public.profiles ALTER COLUMN balance SET DEFAULT 100000;


-- ============================================================
-- 2. ACTIVITY LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Drop the old xp_earned column if it exists (gamification removed)
ALTER TABLE public.activity_logs DROP COLUMN IF EXISTS xp_earned;


-- ============================================================
-- 3. TRADE HISTORY TABLE (NEW)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trade_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    market TEXT NOT NULL,          -- 'STOCK', 'FOREX', 'CRYPTO'
    action TEXT NOT NULL,          -- 'BUY' or 'SELL'
    symbol TEXT NOT NULL,          -- e.g. 'RELIANCE.NS', 'EUR/USD', 'BTCUSDT'
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,        -- price per unit at time of trade
    total_value NUMERIC NOT NULL,  -- quantity * price
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- 4. CLEANUP: Drop old gamification tables & functions
-- ============================================================

DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;
DROP TABLE IF EXISTS public.leaderboard_snapshots CASCADE;

DROP FUNCTION IF EXISTS public.check_and_award_badges(UUID);
DROP FUNCTION IF EXISTS public.award_xp_securely(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.award_xp_securely(UUID, INTEGER, TEXT, JSONB);


-- ============================================================
-- 5. CLEANUP: Drop old gamification columns from profiles
-- ============================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS xp;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS streak_days;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS games_played;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS modules_completed;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tournaments_won;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rank;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar;


-- ============================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ── Profiles ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start clean
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
END $$;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── Activity Logs ──
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;
END $$;

CREATE POLICY "Users can view their own activity logs"
    ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
    ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Trade History ──
ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own trade history" ON public.trade_history;
    DROP POLICY IF EXISTS "Users can insert their own trade history" ON public.trade_history;
END $$;

CREATE POLICY "Users can view their own trade history"
    ON public.trade_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade history"
    ON public.trade_history FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, balance, stock_holdings, forex_holdings, crypto_holdings)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Student'),
        100000,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 8. INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON public.trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON public.trade_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_history_market ON public.trade_history(market);


-- ============================================================
-- DONE. Your database is now clean and ready.
-- ============================================================
