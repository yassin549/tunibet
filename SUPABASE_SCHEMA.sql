-- TUNIBET Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  google_id TEXT UNIQUE,
  demo_balance DECIMAL(10,2) DEFAULT 1000.00,
  live_balance DECIMAL(10,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rounds table
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number BIGSERIAL,
  server_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  crash_point DECIMAL(10,2) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, active, crashed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  cashout_at DECIMAL(10,2),
  profit DECIMAL(10,2),
  account_type TEXT NOT NULL, -- demo or live
  status TEXT DEFAULT 'pending', -- pending, active, won, lost, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cashed_out_at TIMESTAMPTZ
);

-- Transactions table (deposits/withdrawals)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- deposit, withdrawal
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TND',
  crypto_amount DECIMAL(18,8),
  crypto_currency TEXT,
  wallet_address TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Admin logs
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_round_id ON bets(round_id);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own balance" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- RLS Policies for bets table
CREATE POLICY "Users can view own bets" 
  ON bets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" 
  ON bets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for admin
CREATE POLICY "Admins can view all users" 
  ON users FOR ALL 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view logs" 
  ON admin_logs FOR SELECT 
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a test admin user (optional - for development)
-- Replace with your actual Google ID after first login
-- INSERT INTO users (email, display_name, google_id, is_admin, demo_balance, live_balance)
-- VALUES ('admin@tunibet.tn', 'Admin', 'your-google-id-here', true, 10000.00, 1000.00);
