
-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the storage bucket 'property-images' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- ==================================================

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Upload" ON storage.objects;

-- ==================================================
-- CREATE PERMISSIVE POLICIES
-- ==================================================

-- 1. Allow Public Read Access (Anyone can view images)
CREATE POLICY "Allow Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- 2. Allow Authenticated Upload (Any logged in user can upload)
CREATE POLICY "Allow Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'property-images' );

-- 3. Allow Authenticated Update (Owner or Agent can update)
CREATE POLICY "Allow Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'property-images' );

-- 4. Allow Authenticated Delete
CREATE POLICY "Allow Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'property-images' );

