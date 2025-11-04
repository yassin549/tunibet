-- =====================================================
-- PROMPT 10: TELEGRAM BOT INTEGRATION
-- Database Schema for Telegram Features
-- =====================================================

-- =====================================================
-- PART 1: TELEGRAM USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT true,
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  linking_code TEXT UNIQUE,
  code_expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id 
  ON telegram_users(user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id 
  ON telegram_users(telegram_id);

CREATE INDEX IF NOT EXISTS idx_telegram_users_linking_code 
  ON telegram_users(linking_code) WHERE linking_code IS NOT NULL;

-- RLS Policies
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram link"
  ON telegram_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own telegram link"
  ON telegram_users FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all telegram links"
  ON telegram_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- =====================================================
-- PART 2: NOTIFICATION QUEUE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_status 
  ON notification_queue(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id 
  ON notification_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_created 
  ON notification_queue(created_at DESC);

-- RLS Policies
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification queue"
  ON notification_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- =====================================================
-- PART 3: BOT STATISTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bot_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_messages INTEGER DEFAULT 0,
  total_commands INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  command_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bot_stats_date 
  ON bot_stats(date DESC);

-- RLS Policies
ALTER TABLE bot_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bot stats"
  ON bot_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- =====================================================
-- PART 4: HELPER FUNCTIONS
-- =====================================================

-- Function to generate linking code
CREATE OR REPLACE FUNCTION generate_telegram_linking_code(
  p_user_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Generate unique 6-digit code
  LOOP
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM telegram_users 
      WHERE linking_code = v_code 
      AND code_expires_at > NOW()
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  -- Insert or update telegram_users record
  INSERT INTO telegram_users (user_id, linking_code, code_expires_at)
  VALUES (p_user_id, v_code, NOW() + INTERVAL '15 minutes')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    linking_code = v_code,
    code_expires_at = NOW() + INTERVAL '15 minutes';
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_telegram_linking_code TO authenticated;

-- Function to link telegram account
CREATE OR REPLACE FUNCTION link_telegram_account(
  p_linking_code TEXT,
  p_telegram_id BIGINT,
  p_telegram_username TEXT,
  p_telegram_first_name TEXT,
  p_telegram_last_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Find user by linking code
  SELECT user_id INTO v_user_id
  FROM telegram_users
  WHERE linking_code = p_linking_code
    AND code_expires_at > NOW();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code invalide ou expiré'
    );
  END IF;
  
  -- Update telegram info
  UPDATE telegram_users
  SET 
    telegram_id = p_telegram_id,
    telegram_username = p_telegram_username,
    telegram_first_name = p_telegram_first_name,
    telegram_last_name = p_telegram_last_name,
    linked_at = NOW(),
    linking_code = NULL,
    code_expires_at = NULL,
    last_interaction = NOW()
  WHERE user_id = v_user_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue notification
CREATE OR REPLACE FUNCTION queue_notification(
  p_user_id UUID,
  p_type TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_telegram_id BIGINT;
  v_notification_id UUID;
BEGIN
  -- Get telegram ID
  SELECT telegram_id INTO v_telegram_id
  FROM telegram_users
  WHERE user_id = p_user_id
    AND notifications_enabled = true;
  
  IF v_telegram_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Insert notification
  INSERT INTO notification_queue (
    user_id,
    telegram_id,
    type,
    message,
    data
  ) VALUES (
    p_user_id,
    v_telegram_id,
    p_type,
    p_message,
    p_data
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION queue_notification TO authenticated;

-- Function to update bot stats
CREATE OR REPLACE FUNCTION update_bot_stats(
  p_command TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_command_breakdown JSONB;
BEGIN
  -- Get current command breakdown
  SELECT command_breakdown INTO v_command_breakdown
  FROM bot_stats
  WHERE date = v_today;
  
  IF v_command_breakdown IS NULL THEN
    v_command_breakdown := '{}'::JSONB;
  END IF;
  
  -- Update command count
  IF p_command IS NOT NULL THEN
    v_command_breakdown := jsonb_set(
      v_command_breakdown,
      ARRAY[p_command],
      to_jsonb(COALESCE((v_command_breakdown->>p_command)::INTEGER, 0) + 1)
    );
  END IF;
  
  -- Insert or update stats
  INSERT INTO bot_stats (date, total_messages, total_commands, command_breakdown)
  VALUES (
    v_today,
    1,
    CASE WHEN p_command IS NOT NULL THEN 1 ELSE 0 END,
    v_command_breakdown
  )
  ON CONFLICT (date) DO UPDATE SET
    total_messages = bot_stats.total_messages + 1,
    total_commands = bot_stats.total_commands + CASE WHEN p_command IS NOT NULL THEN 1 ELSE 0 END,
    command_breakdown = v_command_breakdown,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending notifications
CREATE OR REPLACE FUNCTION get_pending_notifications(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  telegram_id BIGINT,
  message TEXT,
  data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nq.id,
    nq.telegram_id,
    nq.message,
    nq.data
  FROM notification_queue nq
  WHERE nq.status = 'pending'
    AND nq.attempts < nq.max_attempts
  ORDER BY nq.created_at
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(
  p_notification_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF p_success THEN
    UPDATE notification_queue
    SET 
      status = 'sent',
      sent_at = NOW()
    WHERE id = p_notification_id;
  ELSE
    UPDATE notification_queue
    SET 
      status = CASE 
        WHEN attempts + 1 >= max_attempts THEN 'failed'
        ELSE 'pending'
      END,
      attempts = attempts + 1,
      error_message = p_error_message
    WHERE id = p_notification_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: TRIGGERS
-- =====================================================

-- Trigger to queue deposit notifications
CREATE OR REPLACE FUNCTION notify_deposit_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'deposit' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM queue_notification(
      NEW.user_id,
      'deposit_confirmed',
      format('✅ Dépôt Confirmé\n\nMontant: %s TND\nTransaction ID: #%s', 
        NEW.amount, 
        LEFT(NEW.id::TEXT, 8)
      ),
      jsonb_build_object(
        'transaction_id', NEW.id,
        'amount', NEW.amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_deposit
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_deposit_confirmed();

-- Trigger to queue withdrawal notifications
CREATE OR REPLACE FUNCTION notify_withdrawal_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'withdrawal' AND NEW.status != OLD.status THEN
    IF NEW.status = 'completed' THEN
      PERFORM queue_notification(
        NEW.user_id,
        'withdrawal_approved',
        format('✅ Retrait Approuvé\n\nMontant: %s TND\n\nLe paiement sera traité sous 24h.', 
          NEW.amount
        ),
        jsonb_build_object(
          'transaction_id', NEW.id,
          'amount', NEW.amount
        )
      );
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM queue_notification(
        NEW.user_id,
        'withdrawal_rejected',
        format('❌ Retrait Rejeté\n\nMontant: %s TND\nRaison: %s\n\nLe montant a été remboursé.', 
          NEW.amount,
          COALESCE(NEW.metadata->>'rejection_reason', 'Non spécifié')
        ),
        jsonb_build_object(
          'transaction_id', NEW.id,
          'amount', NEW.amount
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_withdrawal
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_withdrawal_status();

-- =====================================================
-- PART 6: VERIFICATION
-- =====================================================

-- Check tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('telegram_users', 'notification_queue', 'bot_stats')
ORDER BY table_name;

-- Check functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%telegram%' OR routine_name LIKE '%notification%' OR routine_name LIKE '%bot%';
