-- Migration: Add balance_type column for simplified balance system
-- Run this in Supabase SQL Editor

-- Add balance_type column (defaults to 'virtual' for existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS balance_type VARCHAR(10) DEFAULT 'virtual' CHECK (balance_type IN ('virtual', 'real'));

-- Add virtual_balance_saved column to store balance when switching modes
ALTER TABLE users
ADD COLUMN IF NOT EXISTS virtual_balance_saved DECIMAL(10, 2) DEFAULT 1000.00;

-- Update existing users to have balance_type = 'virtual'
UPDATE users 
SET balance_type = 'virtual'
WHERE balance_type IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_balance_type ON users(balance_type);

-- Add comment
COMMENT ON COLUMN users.balance_type IS 'Current active balance mode: virtual or real';
COMMENT ON COLUMN users.virtual_balance_saved IS 'Saved virtual balance when user switches to real mode';
