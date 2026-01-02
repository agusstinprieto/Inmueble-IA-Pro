-- IMPORTANTE: Para agregar agentes correctamente en Supabase
-- 
-- El problema es que no puedes crear un perfil sin un usuario de autenticación.
-- Hay dos opciones:
--
-- OPCIÓN 1: Crear usuarios de autenticación primero (RECOMENDADO)
-- Usa la función de Supabase Admin para crear usuarios:
-- 
-- En el código TypeScript, necesitarías usar supabase.auth.admin.createUser()
-- Esto requiere una clave de servicio (service_role key), no la anon key
--
-- OPCIÓN 2: Permitir perfiles "placeholder" sin autenticación
-- Ejecuta este SQL para permitir perfiles sin ID de autenticación:

-- Hacer que la columna 'id' sea nullable temporalmente
ALTER TABLE profiles ALTER COLUMN id DROP NOT NULL;

-- Agregar una columna para distinguir perfiles completos de placeholders
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT false;

-- Actualizar políticas RLS para permitir crear placeholders
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' OR 
    (id IS NULL AND is_placeholder = true)
);

-- NOTA: Esta es una solución temporal. Lo ideal es usar la OPCIÓN 1
-- y crear usuarios de autenticación reales para cada agente.
