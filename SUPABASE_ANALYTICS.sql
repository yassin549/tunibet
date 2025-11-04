-- =====================================================
-- PROMPT 9: ANALYTICS & REAL-TIME ENGINE
-- Database Schema for Analytics Features
-- =====================================================

-- =====================================================
-- PART 1: ANALYTICS CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL,
  time_period TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_cache_type_period 
  ON analytics_cache(metric_type, time_period);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires 
  ON analytics_cache(expires_at);

-- RLS Policies
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics cache"
  ON analytics_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can insert analytics cache"
  ON analytics_cache FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- =====================================================
-- PART 2: ALERT CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  comparison TEXT DEFAULT 'greater_than', -- greater_than, less_than, equals
  enabled BOOLEAN DEFAULT true,
  notification_method TEXT DEFAULT 'toast', -- toast, email, webhook
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_configs_admin 
  ON alert_configs(admin_id);

CREATE INDEX IF NOT EXISTS idx_alert_configs_enabled 
  ON alert_configs(enabled) WHERE enabled = true;

-- RLS Policies
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their alert configs"
  ON alert_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- =====================================================
-- PART 3: ALERT HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_config_id UUID REFERENCES alert_configs(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  metric_value DECIMAL NOT NULL,
  threshold DECIMAL NOT NULL,
  message TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_history_config 
  ON alert_history(alert_config_id);

CREATE INDEX IF NOT EXISTS idx_alert_history_triggered 
  ON alert_history(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_history_resolved 
  ON alert_history(resolved) WHERE resolved = false;

-- RLS Policies
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alert history"
  ON alert_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update alert history"
  ON alert_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- =====================================================
-- PART 4: ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get revenue analytics
CREATE OR REPLACE FUNCTION get_revenue_analytics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_total_wagered DECIMAL;
  v_total_payout DECIMAL;
  v_total_revenue DECIMAL;
  v_total_bets INTEGER;
  v_avg_bet DECIMAL;
  v_house_edge DECIMAL;
  v_result JSONB;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(profit, 0)), 0),
    COUNT(*)
  INTO 
    v_total_wagered,
    v_total_payout,
    v_total_bets
  FROM bets
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date;
  
  v_total_revenue := v_total_wagered - v_total_payout;
  v_avg_bet := CASE WHEN v_total_bets > 0 THEN v_total_wagered / v_total_bets ELSE 0 END;
  v_house_edge := CASE WHEN v_total_wagered > 0 THEN (v_total_revenue / v_total_wagered) * 100 ELSE 0 END;
  
  v_result := jsonb_build_object(
    'totalWagered', v_total_wagered,
    'totalPayout', v_total_payout,
    'totalRevenue', v_total_revenue,
    'totalBets', v_total_bets,
    'avgBet', v_avg_bet,
    'houseEdge', v_house_edge
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_revenue_analytics TO authenticated;

-- Function to get hourly revenue breakdown
CREATE OR REPLACE FUNCTION get_hourly_revenue(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS TABLE(
  hour TIMESTAMPTZ,
  wagered DECIMAL,
  payout DECIMAL,
  revenue DECIMAL,
  bet_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', created_at) as hour,
    COALESCE(SUM(amount), 0) as wagered,
    COALESCE(SUM(COALESCE(profit, 0)), 0) as payout,
    COALESCE(SUM(amount), 0) - COALESCE(SUM(COALESCE(profit, 0)), 0) as revenue,
    COUNT(*) as bet_count
  FROM bets
  WHERE created_at >= p_start_date
    AND created_at <= p_end_date
  GROUP BY date_trunc('hour', created_at)
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_hourly_revenue TO authenticated;

-- Function to get top players
CREATE OR REPLACE FUNCTION get_top_players(
  p_limit INTEGER DEFAULT 10,
  p_time_period TEXT DEFAULT '24h'
) RETURNS TABLE(
  user_id UUID,
  email TEXT,
  display_name TEXT,
  total_wagered DECIMAL,
  total_profit DECIMAL,
  bet_count BIGINT,
  win_rate DECIMAL
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on period
  v_start_date := CASE p_time_period
    WHEN '24h' THEN NOW() - INTERVAL '24 hours'
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    ELSE NOW() - INTERVAL '24 hours'
  END;
  
  RETURN QUERY
  SELECT 
    b.user_id,
    u.email,
    u.display_name,
    COALESCE(SUM(b.amount), 0) as total_wagered,
    COALESCE(SUM(COALESCE(b.profit, 0)), 0) as total_profit,
    COUNT(*) as bet_count,
    (COUNT(*) FILTER (WHERE b.profit > 0)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as win_rate
  FROM bets b
  JOIN users u ON u.id = b.user_id
  WHERE b.created_at >= v_start_date
  GROUP BY b.user_id, u.email, u.display_name
  ORDER BY total_wagered DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_top_players TO authenticated;

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
  v_active_users INTEGER;
  v_active_rounds INTEGER;
  v_bets_last_minute INTEGER;
  v_revenue_last_hour DECIMAL;
  v_result JSONB;
BEGIN
  -- Active users (last 5 minutes)
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM bets
  WHERE created_at >= NOW() - INTERVAL '5 minutes';
  
  -- Active rounds
  SELECT COUNT(*) INTO v_active_rounds
  FROM rounds
  WHERE status = 'active';
  
  -- Bets in last minute
  SELECT COUNT(*) INTO v_bets_last_minute
  FROM bets
  WHERE created_at >= NOW() - INTERVAL '1 minute';
  
  -- Revenue in last hour
  SELECT 
    COALESCE(SUM(amount), 0) - COALESCE(SUM(COALESCE(profit, 0)), 0)
  INTO v_revenue_last_hour
  FROM bets
  WHERE created_at >= NOW() - INTERVAL '1 hour';
  
  v_result := jsonb_build_object(
    'activeUsers', v_active_users,
    'activeRounds', v_active_rounds,
    'betsPerMinute', v_bets_last_minute,
    'revenueLastHour', v_revenue_last_hour,
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_realtime_metrics TO authenticated;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cache cleanup (run via cron or manually)
-- Call this periodically: SELECT clean_expired_analytics_cache();

-- =====================================================
-- PART 5: VERIFICATION
-- =====================================================

-- Check tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('analytics_cache', 'alert_configs', 'alert_history')
ORDER BY table_name;

-- Check functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_revenue_analytics',
    'get_hourly_revenue',
    'get_top_players',
    'get_realtime_metrics',
    'clean_expired_analytics_cache'
  );

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('analytics_cache', 'alert_configs', 'alert_history')
ORDER BY tablename, indexname;
