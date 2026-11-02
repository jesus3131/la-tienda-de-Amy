CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash_active
  ON user_sessions(user_id, token_hash)
  WHERE is_active=true;

CREATE INDEX IF NOT EXISTS idx_outbox_pending_retry
  ON outbox_events(next_retry_at, created_at)
  WHERE published=false AND failed=false;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_business_date
  ON inventory_movements(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_business_date
  ON sales(business_id, created_at DESC);
