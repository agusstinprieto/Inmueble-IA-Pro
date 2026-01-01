-- ================================================
-- CREAR BUCKET PARA IMÁGENES EN SUPABASE STORAGE
-- ================================================

-- 1. Ve a Supabase Dashboard → Storage
-- 2. Click en "Create a new bucket"
-- 3. Configuración del bucket:
--    Name: property-images
--    Public bucket: YES (para que las URLs sean accesibles)
--    File size limit: 5MB
--    Allowed MIME types: image/jpeg, image/png, image/webp

-- 4. Después de crear el bucket, ve a "Policies"
-- 5. Crea una política para permitir lectura pública:

-- Policy Name: Public Read Access
-- Operation: SELECT
-- Target roles: public
-- USING expression: true

-- Esta política permite que cualquiera pueda leer/ver las imágenes
-- pero solo usuarios autenticados pueden subir (siguiente policy)

-- 6. Crea política para permitir upload a usuarios autenticados:

-- Policy Name: Authenticated Upload
-- Operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression: true

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- Después de crear el bucket y las políticas:
-- 1. Verifica que el bucket "property-images" aparezca en Storage
-- 2. Intenta subir una imagen de prueba manualmente
-- 3. Verifica que puedas ver la URL pública de la imagen

