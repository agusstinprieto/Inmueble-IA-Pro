-- ================================================
-- SCRIPT: ACTUALIZAR Usuario Demo (SIMPLE)
-- EJECUTA ESTO EN SUPABASE SQL EDITOR
-- ================================================

-- PASO 1: Actualizar la contraseña del usuario demo
UPDATE auth.users
SET 
    encrypted_password = crypt('demo123', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'demo@inmuebleiapro.local';

-- PASO 2: Actualizar/Agregar el script_url en el perfil
UPDATE profiles
SET 
    script_url = '',
    location = 'Torreón, Coahuila',
    branding_color = '#f59e0b',
    role = 'admin'
WHERE business_id = 'demo';

-- PASO 3: Verificar que todo está correcto
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.business_id,
    p.business_name,
    p.script_url,
    p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'demo@inmuebleiapro.local';

-- ================================================
-- Resultado esperado:
-- - email: demo@inmuebleiapro.local
-- - email_confirmed_at: (fecha actual)
-- - business_id: demo
-- - script_url: (vacío)
-- - role: admin
-- ================================================
