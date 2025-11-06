-- Fix: Add INSERT policy for users table to allow user creation during signup
-- Run this in Supabase SQL Editor

-- Add INSERT policy so authenticated users can create their own user record
CREATE POLICY "Users can insert own data" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Optionally, also add a policy for service role to insert (for server-side operations)
-- This is useful if you create users from API routes
CREATE POLICY "Service role can insert users" 
  ON users FOR INSERT 
  TO service_role
  WITH CHECK (true);
