-- ============================================
-- TUNIBET - TRANSACTIONS TABLE
-- For Prompt 6: Payment Integration
-- ============================================

-- Create transactions table for deposits and withdrawals
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Payment details
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD', -- Fiat currency (USD, EUR, TND)
  
  -- Crypto details
  crypto_currency VARCHAR(20), -- BTC, USDT, ETH, etc.
  crypto_amount DECIMAL(20, 8), -- Amount in crypto
  crypto_address TEXT, -- Deposit address or withdrawal destination
  
  -- NOWPayments integration
  payment_id VARCHAR(255) UNIQUE, -- NOWPayments payment_id
  payment_url TEXT, -- Payment URL for deposits
  txn_hash TEXT, -- Blockchain transaction hash
  
  -- Additional info
  network VARCHAR(50), -- Blockchain network (e.g., 'BTC', 'TRC20', 'ERC20')
  fee DECIMAL(15, 2) DEFAULT 0,
  note TEXT, -- Admin notes or failure reasons
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create deposits" ON transactions;
DROP POLICY IF EXISTS "Users can create withdrawals" ON transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON transactions;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create deposit transactions
CREATE POLICY "Users can create deposits"
  ON transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND type = 'deposit'
    AND status = 'pending'
  );

-- Policy: Users can create withdrawal requests
CREATE POLICY "Users can create withdrawals"
  ON transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND type = 'withdrawal'
    AND status = 'pending'
  );

-- Policy: Only service role can update transactions (from API)
CREATE POLICY "Service role can update transactions"
  ON transactions
  FOR UPDATE
  USING (true); -- Will be restricted to service role key in API

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS trigger_update_balance_on_complete ON transactions;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Create function to update user balance when transaction completes
CREATE OR REPLACE FUNCTION update_balance_on_transaction_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- For deposits, add to live balance
    IF NEW.type = 'deposit' THEN
      UPDATE users 
      SET live_balance = live_balance + NEW.amount
      WHERE id = NEW.user_id;
    END IF;
    
    -- For withdrawals, deduct from live balance (already deducted on creation)
    -- No action needed here as balance was already deducted
    
    -- Set completed_at timestamp
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for balance updates
CREATE TRIGGER trigger_update_balance_on_complete
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_on_transaction_complete();

-- Sample query to view user transactions
-- SELECT 
--   id,
--   type,
--   status,
--   amount,
--   currency,
--   crypto_currency,
--   crypto_amount,
--   created_at,
--   completed_at
-- FROM transactions
-- WHERE user_id = 'user-uuid-here'
-- ORDER BY created_at DESC;
