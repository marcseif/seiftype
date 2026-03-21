-- SeifType Full Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable required extensions
-- gen_random_uuid() is built-in on modern Postgres / Supabase

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  xp BIGINT DEFAULT 0,
  level INT DEFAULT 1,
  elo INT DEFAULT 1000,
  streak INT DEFAULT 0,
  streak_freeze_count INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  tests_completed INT DEFAULT 0
);

-- Index for fast username lookups
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_elo ON public.users(elo DESC);

-- ============================================================
-- TEST RESULTS
-- ============================================================
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wpm REAL NOT NULL,
  raw_wpm REAL,
  accuracy REAL NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('time', 'words')),
  mode_value INT NOT NULL, -- seconds for time mode, word count for words mode
  content_mode TEXT NOT NULL CHECK (content_mode IN ('random', 'quotes', 'code', 'custom')),
  content_submode TEXT, -- difficulty, language, etc.
  duration_seconds REAL NOT NULL,
  char_count INT DEFAULT 0,
  correct_chars INT DEFAULT 0,
  incorrect_chars INT DEFAULT 0,
  missed_chars INT DEFAULT 0,
  extra_chars INT DEFAULT 0,
  keystroke_data JSONB, -- per-key timing data
  passage_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_results_user ON public.test_results(user_id, created_at DESC);
CREATE INDEX idx_test_results_mode ON public.test_results(mode, content_mode);

-- ============================================================
-- DAILY CHALLENGE
-- ============================================================
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  passage_text TEXT NOT NULL,
  passage_source TEXT,
  word_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_challenges_date ON public.daily_challenges(challenge_date);

-- ============================================================
-- DAILY RESULTS
-- ============================================================
CREATE TABLE public.daily_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  wpm REAL NOT NULL,
  accuracy REAL NOT NULL,
  duration_seconds REAL,
  rank INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

CREATE INDEX idx_daily_results_date ON public.daily_results(challenge_date, wpm DESC);
CREATE INDEX idx_daily_results_user ON public.daily_results(user_id);

-- ============================================================
-- RACES (1v1 Multiplayer)
-- ============================================================
CREATE TABLE public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE,
  player1_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  passage TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'countdown', 'racing', 'finished', 'cancelled')),
  player1_wpm REAL,
  player1_accuracy REAL,
  player1_progress REAL DEFAULT 0,
  player2_wpm REAL,
  player2_accuracy REAL,
  player2_progress REAL DEFAULT 0,
  elo_delta_p1 INT,
  elo_delta_p2 INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_races_room_code ON public.races(room_code);
CREATE INDEX idx_races_status ON public.races(status);
CREATE INDEX idx_races_players ON public.races(player1_id, player2_id);

-- ============================================================
-- MATCHMAKING QUEUE
-- ============================================================
CREATE TABLE public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  elo INT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matchmaking_elo ON public.matchmaking_queue(elo);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX idx_achievements_user ON public.achievements(user_id);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'neon',
  custom_theme JSONB,
  font TEXT DEFAULT 'JetBrains Mono',
  font_size INT DEFAULT 18,
  caret_style TEXT DEFAULT 'line' CHECK (caret_style IN ('block', 'line', 'underline', 'pulse')),
  sound_pack TEXT DEFAULT 'silent' CHECK (sound_pack IN ('silent', 'soft', 'mechanical', 'typewriter')),
  smooth_caret BOOLEAN DEFAULT TRUE,
  show_live_wpm BOOLEAN DEFAULT TRUE,
  show_live_accuracy BOOLEAN DEFAULT TRUE,
  show_virtual_keyboard BOOLEAN DEFAULT FALSE,
  freedom_mode BOOLEAN DEFAULT FALSE,
  restart_key TEXT DEFAULT 'tab_enter',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WEAK BIGRAMS
-- ============================================================
CREATE TABLE public.weak_bigrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bigram TEXT NOT NULL,
  avg_delay_ms REAL NOT NULL,
  error_rate REAL DEFAULT 0,
  sample_count INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bigram)
);

CREATE INDEX idx_weak_bigrams_user ON public.weak_bigrams(user_id, avg_delay_ms DESC);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Test Results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view test results" ON public.test_results
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own test results" ON public.test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Challenges
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges are viewable by everyone" ON public.daily_challenges
  FOR SELECT USING (true);

CREATE POLICY "Only service role can insert challenges" ON public.daily_challenges
  FOR INSERT WITH CHECK (false); -- Edge function uses service role

-- Daily Results
ALTER TABLE public.daily_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily results are viewable by everyone" ON public.daily_results
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own daily results" ON public.daily_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own daily results" ON public.daily_results
    FOR UPDATE USING (auth.uid() = user_id);
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id OR status = 'waiting');

CREATE POLICY "Authenticated users can insert races" ON public.races
  FOR INSERT WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Race participants can update" ON public.races
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Matchmaking Queue
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue is viewable by authenticated users" ON public.matchmaking_queue
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own queue entry" ON public.matchmaking_queue
  FOR ALL USING (auth.uid() = user_id);

-- Achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Weak Bigrams
ALTER TABLE public.weak_bigrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bigrams" ON public.weak_bigrams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bigrams" ON public.weak_bigrams
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to calculate and update user level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount BIGINT)
RETURNS INT AS $$
BEGIN
  -- Each level requires progressively more XP: level N needs N*100 XP
  RETURN GREATEST(1, LEAST(100, FLOOR(SQRT(xp_amount / 50.0)) + 1)::INT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user stats after a test
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  xp_earned BIGINT;
  new_xp BIGINT;
  new_level INT;
  current_date_val DATE;
  user_last_active DATE;
  user_streak INT;
BEGIN
  -- Calculate XP: WPM * accuracy * duration multiplier
  xp_earned := GREATEST(1, FLOOR(
    NEW.wpm * (NEW.accuracy / 100.0) * GREATEST(1, NEW.duration_seconds / 30.0)
  ));

  -- Get user's current data
  SELECT last_active_date, streak INTO user_last_active, user_streak
  FROM public.users WHERE id = NEW.user_id;

  current_date_val := CURRENT_DATE;

  -- Update streak
  IF user_last_active = current_date_val - INTERVAL '1 day' THEN
    user_streak := user_streak + 1;
  ELSIF user_last_active < current_date_val - INTERVAL '1 day' THEN
    user_streak := 1;
  END IF;
  -- If same day, streak stays the same

  -- Update user record
  UPDATE public.users SET
    xp = xp + xp_earned,
    level = public.calculate_level(xp + xp_earned),
    tests_completed = tests_completed + 1,
    streak = user_streak,
    last_active_date = current_date_val
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_test_result_insert
  AFTER INSERT ON public.test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats();

-- Function to update daily leaderboard ranks
CREATE OR REPLACE FUNCTION public.update_daily_ranks(target_date DATE)
RETURNS VOID AS $$
BEGIN
  UPDATE public.daily_results dr SET
    rank = sub.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY wpm DESC, accuracy DESC) as rank
    FROM public.daily_results
    WHERE challenge_date = target_date
  ) sub
  WHERE dr.id = sub.id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Realtime subscriptions for races and daily leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.races;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

��- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 - -   F R I E N D S H I P S 
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 C R E A T E   T A B L E   p u b l i c . f r i e n d s h i p s   ( 
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) , 
     u s e r _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   p u b l i c . u s e r s ( i d )   O N   D E L E T E   C A S C A D E , 
     f r i e n d _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   p u b l i c . u s e r s ( i d )   O N   D E L E T E   C A S C A D E , 
     s t a t u s   T E X T   D E F A U L T   ' p e n d i n g '   C H E C K   ( s t a t u s   I N   ( ' p e n d i n g ' ,   ' a c c e p t e d ' ,   ' b l o c k e d ' ) ) , 
     c r e a t e d _ a t   T I M E S T A M P T Z   D E F A U L T   N O W ( ) , 
     u p d a t e d _ a t   T I M E S T A M P T Z   D E F A U L T   N O W ( ) , 
     U N I Q U E ( u s e r _ i d ,   f r i e n d _ i d ) 
 ) ; 
 
 C R E A T E   I N D E X   i d x _ f r i e n d s h i p s _ u s e r   O N   p u b l i c . f r i e n d s h i p s ( u s e r _ i d ,   s t a t u s ) ; 
 C R E A T E   I N D E X   i d x _ f r i e n d s h i p s _ f r i e n d   O N   p u b l i c . f r i e n d s h i p s ( f r i e n d _ i d ,   s t a t u s ) ; 
 
 A L T E R   T A B L E   p u b l i c . f r i e n d s h i p s   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 
 C R E A T E   P O L I C Y   \ 
 
 U s e r s 
 
 c a n 
 
 v i e w 
 
 t h e i r 
 
 o w n 
 
 f r i e n d s h i p s \   O N   p u b l i c . f r i e n d s h i p s 
     F O R   S E L E C T   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d   O R   a u t h . u i d ( )   =   f r i e n d _ i d ) ; 
 
 C R E A T E   P O L I C Y   \ U s e r s 
 
 c a n 
 
 i n s e r t 
 
 f r i e n d s h i p s \   O N   p u b l i c . f r i e n d s h i p s 
     F O R   I N S E R T   W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ; 
 
 C R E A T E   P O L I C Y   \ U s e r s 
 
 c a n 
 
 u p d a t e 
 
 f r i e n d s h i p s 
 
 w h e r e 
 
 t h e y 
 
 a r e 
 
 t h e 
 
 f r i e n d \   O N   p u b l i c . f r i e n d s h i p s 
     F O R   U P D A T E   U S I N G   ( a u t h . u i d ( )   =   f r i e n d _ i d ) ; 
 
 C R E A T E   P O L I C Y   \ U s e r s 
 
 c a n 
 
 d e l e t e 
 
 t h e i r 
 
 o w n 
 
 f r i e n d s h i p s \   O N   p u b l i c . f r i e n d s h i p s 
     F O R   D E L E T E   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d   O R   a u t h . u i d ( )   =   f r i e n d _ i d ) ; 
 
 
 