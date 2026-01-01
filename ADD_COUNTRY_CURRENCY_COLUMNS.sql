-- ================================================
-- AGREGAR COLUMNAS DE LOCALIZACIÓN A PROPERTIES
-- Ejecuta esto en Supabase SQL Editor
-- ================================================

-- 1. Agregar columna country a la tabla properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'MEXICO';

-- 2. Agregar columna currency a la tabla properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MXN';

-- 3. Actualizar propiedades existentes con valores default
UPDATE properties
SET 
    country = 'MEXICO',
    currency = 'MXN'
WHERE country IS NULL OR currency IS NULL;

-- 4. Verificar que se agregaron las columnas
SELECT 
    id,
    title,
    country,
    currency,
    operation
FROM properties
LIMIT 5;

-- ================================================
-- Resultado esperado:
-- Las propiedades ahora tienen country y currency
-- ================================================
