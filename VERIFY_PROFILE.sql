-- Verificar y corregir el perfil del usuario demo

-- 1. Ver el estado actual del perfil
SELECT 
    u.id,
    u.email,
    p.business_id,
    p.business_name,
    p.script_url,
    p.location,
    p.branding_color,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'demo@inmuebleiapro.local';

-- 2. Si script_url es NULL, actualízalo
UPDATE profiles
SET 
    script_url = '',
    location = COALESCE(location, 'Torreón, Coahuila'),
    branding_color = COALESCE(branding_color, '#f59e0b'),
    role = COALESCE(role, 'admin')
WHERE business_id = 'demo';

-- 3. Verificar de nuevo
SELECT * FROM profiles WHERE business_id = 'demo';
