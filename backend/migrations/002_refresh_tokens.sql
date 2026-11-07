-- Add refresh token columns
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token
  ON user_sessions(refresh_token_hash)
  WHERE is_active=true AND refresh_token_hash IS NOT NULL;

-- Create helper functions for RLS (idempotent)
CREATE OR REPLACE FUNCTION public.app_business_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_business_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.app_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Create app_user role if not exists (local dev only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app_user_dev_password';
  END IF;
END $$;

-- Enable RLS on users (idempotent)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy only if app_user exists (always true after above)
DROP POLICY IF EXISTS users_tenant ON users;
CREATE POLICY users_tenant ON users FOR ALL TO app_user
  USING (business_id = public.app_business_id() OR id = public.app_user_id())
  WITH CHECK (business_id = public.app_business_id() OR id = public.app_user_id());