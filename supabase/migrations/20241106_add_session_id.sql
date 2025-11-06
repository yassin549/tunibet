-- Add session_id column to users table for Telegram bot integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);

-- Add comment
COMMENT ON COLUMN users.session_id IS 'Unique session ID for Telegram bot integration';
