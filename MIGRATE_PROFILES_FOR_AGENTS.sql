-- Migration: Add missing columns to profiles table to support SaaS agents
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commission DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Update RLS for profiles if needed (should already be fine based on previous turn)
-- But let's ensure people can see agents in their agency
DROP POLICY IF EXISTS "Public profiles can be read by auth users" ON profiles;
CREATE POLICY "Public profiles can be read by auth users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
