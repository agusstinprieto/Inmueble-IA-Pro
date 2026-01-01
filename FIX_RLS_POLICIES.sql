-- ==========================================
-- FIX RLS POLICIES (Error 42501 Solution)
-- ==========================================

-- 1. Ensure PROFILES are readable. 
-- Often RLS fails because it cannot read the 'profiles' table to check your agency_id.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;
DROP POLICY IF EXISTS "Read access for authenticated users" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true );

-- 2. Reset PROPERTIES Policy
-- We'll verify that the user can Manage properties if the agency_id matches their own.
DROP POLICY IF EXISTS "Manage Agency Properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;

CREATE POLICY "Manage Agency Properties" 
ON properties 
FOR ALL 
USING (
  -- Permite operar si la propiedad pertenece a tu misma agencia
  agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  -- Para INSERT/UPDATE: Verifica que la nueva fila tenga tu mismo agency_id
  agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
);

-- 3. Grant permissions (just in case)
GRANT ALL ON properties TO authenticated;
GRANT SELECT ON profiles TO authenticated;
