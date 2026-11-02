ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token
  ON user_sessions(refresh_token_hash)
  WHERE is_active=true AND refresh_token_hash IS NOT NULL;

DROP POLICY IF EXISTS users_tenant ON users;
CREATE POLICY users_tenant ON users FOR ALL TO app_user
  USING (business_id = public.app_business_id() OR id = public.app_user_id())
  WITH CHECK (business_id = public.app_business_id() OR id = public.app_user_id());
