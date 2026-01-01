-- =============================================
-- ADD MISSING PROPERTIES COLUMNS
-- =============================================

-- Add columns for specs if they don't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS m2_total DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS m2_built DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floors INTEGER DEFAULT 1;

-- Add columns for location specifics if they don't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'MEXICO';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Verify constraints or defaults
ALTER TABLE properties ALTER COLUMN type SET DEFAULT 'CASA';
ALTER TABLE properties ALTER COLUMN operation SET DEFAULT 'VENTA';
