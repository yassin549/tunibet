# Tunibet Database Setup Guide

## Issue: "Error creating user: {}"

This error occurs when trying to sign up new users because the database is missing a critical RLS (Row Level Security) policy.

## Solution

You need to run the following SQL scripts in your Supabase SQL Editor in this exact order:

### Step 1: Run the Main Schema (if not already done)
```bash
File: SUPABASE_SCHEMA.sql
```
This creates all the tables and basic RLS policies.

### Step 2: Run the Balance Type Migration
```bash
File: MIGRATION_BALANCE_TYPE.sql
```
This adds the `balance_type` and `virtual_balance_saved` columns.

### Step 3: **CRITICAL** - Fix the Missing INSERT Policy
```bash
File: FIX_USER_INSERT_POLICY.sql
```
This adds the missing policy that allows users to create their own records during signup.

## How to Run in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of each file in order
5. Click **Run** for each script

## Verification

After running all scripts, try signing up again. You should now be able to create an account successfully.

## What Was Wrong?

The database had Row Level Security (RLS) enabled for the users table with these policies:
- ✅ Users can SELECT their own data
- ✅ Users can UPDATE their own balance
- ❌ **Users CANNOT INSERT** (missing policy)
- ✅ Admins can do everything

The missing INSERT policy prevented new users from creating their records during signup.

## Alternative: Disable RLS (NOT RECOMMENDED)

If you want to quickly test without RLS (not recommended for production):

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

But this removes all security protections! Use only for local testing.

## After Setup

Once you've run all the SQL scripts, restart your dev server:

```bash
pnpm dev
```

Then try signing up again. You should see the user created successfully with the message "Compte créé avec succès!" (Account created successfully!)
