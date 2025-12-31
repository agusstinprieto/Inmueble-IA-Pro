-- ================================================
-- SCRIPT: Cambiar Contraseña Usuario Demo (OPCIONAL)
-- Para INMUEBLE IA PRO
-- ================================================

-- Cambiar la contraseña del usuario demo
-- NOTA: Solo ejecuta esto si necesitas cambiar la contraseña en el futuro
-- La contraseña actual configurada es: demo123

UPDATE auth.users
SET 
    encrypted_password = crypt('demo123', gen_salt('bf')),
    updated_at = now()
WHERE email = 'demo@inmuebleiapro.local';

-- Verificar cambio
SELECT 
    u.email,
    p.business_name,
    p.business_id,
    u.updated_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'demo@inmuebleiapro.local';

-- ================================================
-- INSTRUCCIONES:
-- ================================================
-- Este script es OPCIONAL. Solo úsalo si necesitas:
-- 1. Cambiar la contraseña del usuario demo en el futuro
-- 2. Resetear el acceso de un usuario
-- 
-- Para cambiar la contraseña:
-- - Modifica 'demo123' en la línea 11 por la nueva contraseña
-- - Ejecuta el script en Supabase SQL Editor
-- ================================================

