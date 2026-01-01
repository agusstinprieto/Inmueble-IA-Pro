-- =============================================
-- FIX DEMO USER PROFILE & AGENCY
-- =============================================

DO $$
DECLARE
  v_user_id UUID;
  v_agency_id UUID;
BEGIN
  -- 1. Get User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@inmuebleiapro.local';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User demo@inmuebleiapro.local not found. Please create it in Auth > Users first.';
    RETURN;
  END IF;

  -- 2. Ensure Agency Exists
  -- Check if user already owns an agency
  SELECT id INTO v_agency_id FROM agencies WHERE owner_id = v_user_id LIMIT 1;

  IF v_agency_id IS NULL THEN
    -- Create new agency for demo
    INSERT INTO agencies (owner_id, name, logo_url, plan_type, status)
    VALUES (v_user_id, 'Inmueble IA Pro Demo', 'https://via.placeholder.com/150', 'ENTERPRISE', 'ACTIVE')
    RETURNING id INTO v_agency_id;
    RAISE NOTICE 'Created new agency for demo user.';
  ELSE
    RAISE NOTICE 'Demo user already has an agency: %', v_agency_id;
  END IF;

  -- 3. Ensure Profile Exists & Linked
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    -- Update existing profile
    UPDATE profiles 
    SET agency_id = v_agency_id, 
        role = 'agency_owner',
        name = 'Usuario Demo'
    WHERE id = v_user_id;
    RAISE NOTICE 'Updated existing profile for demo user.';
  ELSE
    -- Create profile
    INSERT INTO profiles (id, agency_id, role, name, email)
    VALUES (v_user_id, v_agency_id, 'agency_owner', 'Usuario Demo', 'demo@inmuebleiapro.local');
    RAISE NOTICE 'Created new profile for demo user.';
  END IF;

END $$;
