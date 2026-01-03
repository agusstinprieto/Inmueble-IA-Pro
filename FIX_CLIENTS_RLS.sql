-- =============================================
-- FIX CLIENTS RLS POLICY
-- =============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all access for agency members" ON clients;
DROP POLICY IF EXISTS "View Agency Clients" ON clients;
DROP POLICY IF EXISTS "Manage Agency Clients" ON clients;

-- Create a comprehensive policy handling both Agency and Personal (Freelancer) modes
CREATE POLICY "Manage Clients Policy" ON clients
FOR ALL
USING (
  -- Case 1: Agency Match (User belongs to the same agency as the client)
  (agency_id IS NOT NULL AND agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()))
  OR
  -- Case 2: Personal Ownership (User is the assigned agent, useful for freelancers or direct assignments)
  (agent_id = auth.uid())
)
WITH CHECK (
  -- Apply the same logic for inserts/updates
  (agency_id IS NOT NULL AND agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()))
  OR
  (agent_id = auth.uid())
);

-- Grant permissions to authenticated users to ensure they can attempt operations
GRANT ALL ON clients TO authenticated;
