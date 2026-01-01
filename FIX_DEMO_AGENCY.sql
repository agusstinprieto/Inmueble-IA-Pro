-- 1. Asegurar que existe una agencia Demo
INSERT INTO agencies (id, name, logo_url, plan_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'Agencia Demo', 
  'https://ui-avatars.com/api/?name=Demo+Agency&background=0D8ABC&color=fff', 
  'ENTERPRISE', 
  'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Asignar todos los usuarios sin agencia a la agencia Demo (incluyendo el usuario actual)
UPDATE profiles 
SET agency_id = '00000000-0000-0000-0000-000000000000',
    role = 'agency_owner'
WHERE agency_id IS NULL;

-- 3. Crear una rama por defecto para la agencia si no existe
INSERT INTO branches (id, agency_id, name, address, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'Oficina Central',
  'Calle Demo 123',
  '+52 55 1234 5678'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Opcional: Asegurar que el usuario tenga rama asignada
UPDATE profiles
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL AND agency_id = '00000000-0000-0000-0000-000000000000';
