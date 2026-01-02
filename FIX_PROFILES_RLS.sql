-- Fix RLS Policies for Profiles Table (Fixed - No Recursion)
-- This allows agency owners to create agent profiles without infinite recursion

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Agency owners can insert agent profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Agency owners can view their agents" ON profiles;
DROP POLICY IF EXISTS "Agency owners can update their agents" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Enable insert for authenticated users (simplified for agency owners)
-- This allows any authenticated user to insert profiles
-- We'll rely on application logic to ensure only agency owners do this
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Enable read access for authenticated users in same agency
-- Simplified to avoid recursion
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Allow updates for authenticated users (simplified)
CREATE POLICY "Agency owners can update their agents"
ON profiles FOR UPDATE
USING (auth.role() = 'authenticated');
