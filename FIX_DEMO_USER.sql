-- ================================================
-- SCRIPT: CREAR/RESETEAR Usuario Demo
-- EJECUTA ESTO EN SUPABASE SQL EDITOR
-- ================================================

-- PASO 1: Eliminar perfil demo si existe (primero por las foreign keys)
DELETE FROM profiles WHERE business_id = 'demo';

-- PASO 2: Eliminar usuario demo si existe
DELETE FROM auth.users WHERE email = 'demo@inmuebleiapro.local';

-- PASO 2: Crear el usuario demo con contraseña demo123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'demo@inmuebleiapro.local',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"email_verified":true}'::jsonb,
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
)
RETURNING id, email;

-- PASO 3: Crear perfil para el usuario
-- Nota: Reemplaza el UUID con el que se generó arriba
INSERT INTO profiles (
    id,
    business_id,
    business_name,
    location,
    script_url,
    branding_color,
    role
)
SELECT 
    id,
    'demo',
    'INMUEBLE IA PRO Demo',
    'Torreón, Coahuila',
    '',
    '#f59e0b',
    'admin'
FROM auth.users
WHERE email = 'demo@inmuebleiapro.local';

-- PASO 4: Verificar que todo está correcto
SELECT 
    u.id,
    u.email,
    p.business_id,
    p.business_name,
    p.role,
    u.email_confirmed_at,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'demo@inmuebleiapro.local';

-- ================================================
-- El resultado debe mostrar:
-- - email: demo@inmuebleiapro.local
-- - business_id: demo
-- - business_name: INMUEBLE IA PRO Demo
-- - role: admin
-- ================================================
