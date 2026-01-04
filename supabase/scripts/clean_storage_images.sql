-- Script para limpiar imágenes del Storage de Supabase
-- IMPORTANTE: Ejecuta esto DESPUÉS de eliminar las propiedades de la tabla

-- 1. Ver todas las imágenes en el bucket
-- (Esto no se puede hacer con SQL, debes ir a Storage en Supabase Dashboard)

-- 2. Para eliminar TODAS las imágenes del bucket 'property-images':
-- Ve a: Supabase Dashboard → Storage → property-images → Settings → Empty bucket

-- 3. Para eliminar imágenes de una propiedad específica:
-- Ve a: Storage → property-images → Busca la carpeta con el ID de la propiedad → Delete

-- NOTA: Las imágenes NO se eliminan automáticamente cuando borras una propiedad
-- Debes eliminarlas manualmente desde el Storage o crear un trigger

-- ============================================
-- TRIGGER AUTOMÁTICO (Opcional - Avanzado)
-- ============================================
-- Este trigger eliminaría las imágenes automáticamente al borrar una propiedad
-- ADVERTENCIA: Requiere configurar una Edge Function en Supabase

/*
CREATE OR REPLACE FUNCTION delete_property_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Aquí iría la lógica para llamar a una Edge Function
  -- que elimine las imágenes del Storage usando el API de Supabase
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_property_delete
  BEFORE DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION delete_property_images();
*/

-- ============================================
-- CONSULTA ÚTIL: Ver propiedades con sus imágenes
-- ============================================
SELECT 
    id,
    title,
    images,
    array_length(images, 1) as num_images,
    date_added
FROM properties
ORDER BY date_added DESC;
