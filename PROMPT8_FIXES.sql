-- =====================================================
-- PROMPT 8 - PERFORMANCE & SECURITY FIXES
-- Run these after SUPABASE_ADMIN.sql
-- =====================================================

-- =====================================================
-- PART 1: MISSING INDEXES
-- =====================================================

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
  ON transactions(type, status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id_type 
  ON transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
  ON transactions(created_at DESC);

-- Bets table indexes
CREATE INDEX IF NOT EXISTS idx_bets_created_at 
  ON bets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bets_user_id 
  ON bets(user_id);

CREATE INDEX IF NOT EXISTS idx_bets_round_id 
  ON bets(round_id);

CREATE INDEX IF NOT EXISTS idx_bets_status 
  ON bets(status);

-- Rounds table indexes
CREATE INDEX IF NOT EXISTS idx_rounds_status 
  ON rounds(status);

CREATE INDEX IF NOT EXISTS idx_rounds_created_at 
  ON rounds(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rounds_round_number 
  ON rounds(round_number DESC);

-- Users table indexes (partial indexes for efficiency)
CREATE INDEX IF NOT EXISTS idx_users_is_admin 
  ON users(is_admin) 
  WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_users_is_banned 
  ON users(is_banned) 
  WHERE is_banned = true;

CREATE INDEX IF NOT EXISTS idx_users_updated_at 
  ON users(updated_at DESC);

-- =====================================================
-- PART 2: ATOMIC WITHDRAWAL REJECTION
-- =====================================================

CREATE OR REPLACE FUNCTION reject_withdrawal_with_refund(
  p_withdrawal_id UUID,
  p_refund_amount DECIMAL,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_withdrawal RECORD;
  v_result JSONB;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal
  FROM transactions
  WHERE id = p_withdrawal_id
    AND type = 'withdrawal'
    AND status = 'pending'
  FOR UPDATE; -- Lock row
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Withdrawal not found or already processed'
    );
  END IF;
  
  v_user_id := v_withdrawal.user_id;
  
  -- Start atomic transaction
  BEGIN
    -- Update withdrawal status
    UPDATE transactions
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = p_withdrawal_id;
    
    -- Refund user balance
    UPDATE users
    SET 
      live_balance = live_balance + p_refund_amount,
      updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Create audit log
    INSERT INTO admin_logs (
      admin_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state,
      reason,
      ip_address,
      user_agent
    ) VALUES (
      p_admin_id,
      'reject_withdrawal',
      'transaction',
      p_withdrawal_id,
      jsonb_build_object(
        'status', v_withdrawal.status,
        'amount', v_withdrawal.amount
      ),
      jsonb_build_object(
        'status', 'cancelled',
        'refunded', p_refund_amount
      ),
      COALESCE(p_reason, 'Withdrawal rejected by admin'),
      p_ip_address,
      p_user_agent
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'withdrawal_id', p_withdrawal_id,
      'refunded', p_refund_amount
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reject_withdrawal_with_refund TO authenticated;

-- =====================================================
-- PART 3: OPTIMIZED STATS QUERY
-- =====================================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_pending_withdrawals INTEGER;
  v_total_withdrawal_amount DECIMAL;
  v_active_rounds INTEGER;
  v_total_bets_today INTEGER;
  v_total_wagered_today DECIMAL;
  v_total_payout_today DECIMAL;
  v_banned_users INTEGER;
  v_result JSONB;
BEGIN
  -- Get all stats in parallel (single query per metric)
  SELECT COUNT(*) INTO v_total_users FROM users;
  
  SELECT COUNT(*) INTO v_active_users 
  FROM users 
  WHERE updated_at >= NOW() - INTERVAL '24 hours';
  
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO 
    v_pending_withdrawals,
    v_total_withdrawal_amount
  FROM transactions
  WHERE type = 'withdrawal' AND status = 'pending';
  
  SELECT COUNT(*) INTO v_active_rounds 
  FROM rounds 
  WHERE status = 'active';
  
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(profit, 0)), 0)
  INTO 
    v_total_bets_today,
    v_total_wagered_today,
    v_total_payout_today
  FROM bets
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO v_banned_users 
  FROM users 
  WHERE is_banned = true;
  
  -- Build result
  v_result := jsonb_build_object(
    'totalUsers', v_total_users,
    'activeUsers', v_active_users,
    'pendingWithdrawals', v_pending_withdrawals,
    'totalWithdrawalAmount', v_total_withdrawal_amount,
    'activeRounds', v_active_rounds,
    'totalBetsToday', v_total_bets_today,
    'revenueToday', v_total_wagered_today - v_total_payout_today,
    'bannedUsers', v_banned_users
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_admin_stats TO authenticated;

-- =====================================================
-- PART 4: BATCH WITHDRAWAL APPROVAL
-- =====================================================

CREATE OR REPLACE FUNCTION batch_approve_withdrawals(
  p_withdrawal_ids UUID[],
  p_admin_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_withdrawal_id UUID;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- Process each withdrawal
  FOREACH v_withdrawal_id IN ARRAY p_withdrawal_ids
  LOOP
    BEGIN
      -- Update withdrawal
      UPDATE transactions
      SET 
        status = 'completed',
        updated_at = NOW()
      WHERE id = v_withdrawal_id
        AND type = 'withdrawal'
        AND status = 'pending';
      
      IF FOUND THEN
        -- Create audit log
        INSERT INTO admin_logs (
          admin_id,
          action,
          target_type,
          target_id,
          before_state,
          after_state,
          reason,
          ip_address,
          user_agent
        ) VALUES (
          p_admin_id,
          'approve_withdrawal',
          'transaction',
          v_withdrawal_id,
          jsonb_build_object('status', 'pending'),
          jsonb_build_object('status', 'completed'),
          'Batch approval by admin',
          p_ip_address,
          p_user_agent
        );
        
        v_success_count := v_success_count + 1;
      ELSE
        v_error_count := v_error_count + 1;
        v_errors := v_errors || jsonb_build_object(
          'id', v_withdrawal_id,
          'error', 'Not found or already processed'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'id', v_withdrawal_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'successCount', v_success_count,
    'errorCount', v_error_count,
    'errors', v_errors
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION batch_approve_withdrawals TO authenticated;

-- =====================================================
-- PART 5: INCREMENT BALANCE FUNCTION (if not exists)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_account_type TEXT DEFAULT 'live'
) RETURNS VOID AS $$
BEGIN
  IF p_account_type = 'demo' THEN
    UPDATE users
    SET 
      demo_balance = demo_balance + p_amount,
      updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    UPDATE users
    SET 
      live_balance = live_balance + p_amount,
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_balance TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'transactions', 'bets', 'rounds', 'admin_logs')
ORDER BY tablename, indexname;

-- Test stats function
SELECT get_admin_stats();

-- Check functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'reject_withdrawal_with_refund',
    'get_admin_stats',
    'batch_approve_withdrawals',
    'increment_balance'
  );
