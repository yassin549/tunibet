-- =====================================================
-- TUNIBET - ADMIN PANEL DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Admin Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'approve_withdrawal', 'reject_withdrawal', 'ban_user', 'unban_user', 'adjust_balance', 'pause_round', 'force_round'
  target_type TEXT NOT NULL, -- 'user', 'transaction', 'round'
  target_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

-- Add is_admin column to users if not exists (safe to run multiple times)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add notification preferences columns if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'bet_notifications'
  ) THEN
    ALTER TABLE users ADD COLUMN bet_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'transaction_notifications'
  ) THEN
    ALTER TABLE users ADD COLUMN transaction_notifications BOOLEAN DEFAULT true;
  END IF;
END $$;

-- RLS Policies for admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
  ON admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Only admins can insert logs (via service role in practice)
CREATE POLICY "Admins can insert logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Function to create admin log entry
CREATE OR REPLACE FUNCTION create_admin_log(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
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
    p_action,
    p_target_type,
    p_target_id,
    p_before_state,
    p_after_state,
    p_reason,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_admin_log TO authenticated;

-- =====================================================
-- SEED ADMIN USER (OPTIONAL - FOR TESTING)
-- Replace with your actual email
-- =====================================================

-- Uncomment and modify this to create your first admin:
/*
UPDATE users 
SET is_admin = true 
WHERE email = 'your-email@gmail.com';
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if admin_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'admin_logs'
) AS admin_logs_exists;

-- Check admin users
SELECT id, email, display_name, is_admin 
FROM users 
WHERE is_admin = true;

-- View recent admin logs
SELECT 
  al.id,
  u.email AS admin_email,
  al.action,
  al.target_type,
  al.target_id,
  al.reason,
  al.created_at
FROM admin_logs al
LEFT JOIN users u ON al.admin_id = u.id
ORDER BY al.created_at DESC
LIMIT 10;
