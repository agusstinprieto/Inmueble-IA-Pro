-- =============================================
-- ADD MISSING RLS POLICIES
-- =============================================

-- 1. BRANCHES POLICY
DROP POLICY IF EXISTS "View Agency Branches" ON branches;
CREATE POLICY "View Agency Branches" ON branches
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "Manage Agency Branches" ON branches;
CREATE POLICY "Manage Agency Branches" ON branches
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('agency_owner', 'super_admin')
  );

-- 2. CLIENTS POLICY
DROP POLICY IF EXISTS "View Agency Clients" ON clients;
DROP POLICY IF EXISTS "Manage Agency Clients" ON clients;

CREATE POLICY "Enable all access for agency members" ON clients
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- 3. CONTRACTS POLICY
DROP POLICY IF EXISTS "Enable all access for agency members" ON contracts;
CREATE POLICY "Enable all access for agency members" ON contracts
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- 4. SALES POLICY
DROP POLICY IF EXISTS "Enable all access for agency members" ON sales;
CREATE POLICY "Enable all access for agency members" ON sales
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- 5. FOLLOW_UPS POLICY
-- Follow ups are linked to clients, so we check the client's agency via join or just assume good faith if we trust the client_id access?
-- Better to be safe and check implicit agency access via client link.
-- However, for simplicity and performance, usually we just check if the user has access to the client.
-- But standard SaaS pattern: just check if the user is in the same agency as the client (if we denormalized agency_id to follow_ups?)
-- The follow_ups table defined in SUPABASE_SETUP does NOT have agency_id. It only has client_id.
-- So we must check via client.
DROP POLICY IF EXISTS "View Client FollowUps" ON follow_ups;
CREATE POLICY "View Client FollowUps" ON follow_ups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = follow_ups.client_id
      AND clients.agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Manage Client FollowUps" ON follow_ups;
CREATE POLICY "Manage Client FollowUps" ON follow_ups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = follow_ups.client_id
      AND clients.agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );
