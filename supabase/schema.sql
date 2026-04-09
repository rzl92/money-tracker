-- Jalankan SQL ini di Supabase SQL Editor
-- https://app.supabase.com -> SQL Editor -> New Query

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#6366f1',
  type TEXT CHECK (type IN ('expense', 'income', 'both')) DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
  amount BIGINT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram users table
CREATE TABLE IF NOT EXISTS telegram_users (
  telegram_id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram link tokens (sementara, expired 10 menit)
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Row Level Security (RLS) - Penting untuk keamanan!
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_link_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own categories"
  ON categories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own telegram data"
  ON telegram_users FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own link tokens"
  ON telegram_link_tokens FOR ALL USING (auth.uid() = user_id);

-- Default categories untuk user baru (gunakan trigger)
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Makan & Minum', '🍽️', '#f97316', 'expense'),
    (NEW.id, 'Transport', '🚗', '#3b82f6', 'expense'),
    (NEW.id, 'Belanja', '🛒', '#8b5cf6', 'expense'),
    (NEW.id, 'Hiburan', '🎬', '#ec4899', 'expense'),
    (NEW.id, 'Kesehatan', '💊', '#10b981', 'expense'),
    (NEW.id, 'Tagihan', '📱', '#f59e0b', 'expense'),
    (NEW.id, 'Gaji', '💰', '#22c55e', 'income'),
    (NEW.id, 'Freelance', '💻', '#06b6d4', 'income'),
    (NEW.id, 'Lainnya', '📦', '#6b7280', 'both');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();
