-- Migration: Add Usage Tracking and Subscription Tiers
-- Created: 2026-01-03

-- 1. Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  limits JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agency_settings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  month_year TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, feature_type, month_year)
);

-- 3. Add subscription columns to agency_settings
ALTER TABLE agency_settings 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 4. Insert default tier data
INSERT INTO subscription_tiers (name, display_name, price_usd, limits) VALUES
('individual', 'Agente Individual', 29.00, '{
  "propertyAnalysis": 50,
  "adGeneration": 100,
  "voiceQueries": 20,
  "contracts": 10
}'::jsonb),
('small_agency', 'Agencia Pequeña', 99.00, '{
  "propertyAnalysis": 200,
  "adGeneration": 400,
  "voiceQueries": 80,
  "contracts": 40
}'::jsonb),
('corporate', 'Agencia Corporativa', 299.00, '{
  "propertyAnalysis": 1000,
  "adGeneration": 2000,
  "voiceQueries": 400,
  "contracts": 200
}'::jsonb),
('enterprise', 'Enterprise', 999.00, '{
  "propertyAnalysis": -1,
  "adGeneration": -1,
  "voiceQueries": -1,
  "contracts": -1
}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 5. Create RLS policies for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own agency's usage
CREATE POLICY "Users can view own agency usage"
  ON usage_tracking FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agents WHERE user_id = auth.uid()
    )
  );

-- System can insert/update usage (service role only)
CREATE POLICY "Service can manage usage"
  ON usage_tracking FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_agency_id UUID,
  p_user_id UUID,
  p_feature_type TEXT
) RETURNS void AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO usage_tracking (agency_id, user_id, feature_type, month_year, count)
  VALUES (p_agency_id, p_user_id, p_feature_type, v_month_year, 1)
  ON CONFLICT (agency_id, feature_type, month_year)
  DO UPDATE SET 
    count = usage_tracking.count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get current usage
CREATE OR REPLACE FUNCTION get_current_usage(
  p_agency_id UUID,
  p_feature_type TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_month_year TEXT;
  v_count INTEGER;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  SELECT COALESCE(count, 0) INTO v_count
  FROM usage_tracking
  WHERE agency_id = p_agency_id
    AND feature_type = p_feature_type
    AND month_year = v_month_year;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_agency_month 
  ON usage_tracking(agency_id, month_year);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature 
  ON usage_tracking(feature_type);
CREATE INDEX IF NOT EXISTS idx_agency_settings_tier 
  ON agency_settings(subscription_tier);
