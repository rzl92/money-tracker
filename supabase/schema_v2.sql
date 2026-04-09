-- ============================================================
-- MIGRATION v2: User Profiles + Role Management
-- Jalankan di Supabase SQL Editor SETELAH schema.sql
-- ============================================================

-- Tabel profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  status TEXT CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Trigger: buat profile saat user baru register
-- User pertama otomatis jadi admin & active
-- User berikutnya jadi user & pending
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  IF profile_count = 0 THEN
    -- User pertama = admin, langsung active
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'admin',
      'active'
    );
  ELSE
    -- User selanjutnya = user biasa, pending
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user',
      'pending'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger lama kalau ada, buat yang baru
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================================
-- Buat profile untuk user yang sudah ada (migration data lama)
-- Semua user existing dijadikan active (sudah pakai app)
-- ============================================================
INSERT INTO public.profiles (id, full_name, role, status)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at ASC) = 1 THEN 'admin'
    ELSE 'user'
  END,
  'active'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
