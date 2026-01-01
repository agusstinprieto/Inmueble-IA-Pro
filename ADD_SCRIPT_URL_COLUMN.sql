-- Agregar la columna script_url a la tabla profiles

-- 1. Agregar la columna si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS script_url TEXT DEFAULT '';

-- 2. Actualizar el perfil del usuario demo
UPDATE profiles
SET script_url = ''
WHERE business_id = 'demo';

-- 3. Verificar que se agregó correctamente
SELECT 
    business_id,
    business_name,
    script_url,
    location,
    branding_color,
    role
FROM profiles 
WHERE business_id = 'demo';
