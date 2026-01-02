-- Fix RLS Policies for Profiles Table
-- This allows agency owners to create agent profiles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Agency owners can insert agent profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Agency owners can view their agents" ON profiles;
DROP POLICY IF EXISTS "Agency owners can update their agents" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Agency owners can insert agent profiles in their agency
CREATE POLICY "Agency owners can insert agent profiles"
ON profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'agency_owner'
        AND agency_id = profiles.agency_id
    )
);

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Agency owners can view all profiles in their agency
CREATE POLICY "Agency owners can view their agents"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'agency_owner'
        AND p.agency_id = profiles.agency_id
    )
);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Agency owners can update profiles in their agency
CREATE POLICY "Agency owners can update their agents"
ON profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'agency_owner'
        AND p.agency_id = profiles.agency_id
    )
);
