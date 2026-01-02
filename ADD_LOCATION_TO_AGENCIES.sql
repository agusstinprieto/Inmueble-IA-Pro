-- Add location column to agencies table
-- This allows agencies to specify their primary location for regional pricing (MXN vs USD)

ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN agencies.location IS 'Primary location of the agency (e.g., "Torreón, Coahuila, México" or "Austin, Texas, USA"). Used for regional pricing and market analysis.';

-- Update existing demo agency with a default location
UPDATE agencies 
SET location = 'Torreón, Coahuila, México'
WHERE name = 'Demo Agency' AND location IS NULL;
