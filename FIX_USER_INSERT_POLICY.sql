-- FIX: Add missing INSERT policy for users table
-- This allows new users to create their own record during signup
-- Run this in Supabase SQL Editor

-- Add INSERT policy for users table
CREATE POLICY "Users can insert own data on signup" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
