# Configuración de Supabase para INMUEBLE IA PRO

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Click en "New Project"
3. Configura:
   - **Name**: `inmueble-ia-pro`
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Selecciona el más cercano (ej: South America o US East)
4. Espera ~2 minutos a que se cree

---

## Paso 2: Obtener Credenciales

1. Ve a **Settings > API**
2. Copia estos valores:
   - **Project URL** → `https://kfrfwodnyrkukqqbjbjh.supabase.co`
   - **anon public key** → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcmZ3b2RueXJrdWtxcWJqYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTUxMzMsImV4cCI6MjA4Mjc3MTEzM30.Mo-4uto9Rx8b7PkHkahKBNS9SFK6H5P51GJLQmu1GWw`

---

## Paso 3: Crear archivo .env.local

Crea el archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...tu_clave_aqui
```

---

## Paso 4: Ejecutar SQL en Supabase

Ve a **SQL Editor** en Supabase y ejecuta este script.
> [!IMPORTANT]
> Copia **SOLO** el código de adentro. **NO** copies las líneas que tienen ` ```sql ` o ` ``` `.

```sql
-- =============================================
-- INMUEBLE IA PRO - RESET & INIT SCRIPT (SaaS B2B)
-- =============================================
-- ⚠️ ADVERTENCIA: ESTE SCRIPT BORRARÁ LOS DATOS EXISTENTES
-- PARA APLICAR LA NUEVA ARQUITECTURA LIMPIA.

-- 1. LIMPIEZA (DROP CASCADE)
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS start_contracts CASCADE; -- Por si acaso
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS agents CASCADE; -- Tabla Legacy
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- 2. TABLA AGENCIES (Empresa/Cliente)
CREATE TABLE agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#f59e0b',
  plan_type TEXT DEFAULT 'FREE', -- FREE, PRO, ENTERPRISE
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA BRANCHES (Sucursales)
CREATE TABLE branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA PROFILES (Perfil de Usuario)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'agency_owner' CHECK (role IN ('super_admin', 'agency_owner', 'branch_manager', 'agent')),
  name TEXT,
  email TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA PROPERTIES (Inventario)
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT DEFAULT 'DISPONIBLE',
  description TEXT,
  street TEXT,
  exterior_number TEXT,
  interior_number TEXT,
  colony TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  sale_price DECIMAL(12, 2) DEFAULT 0,
  rent_price DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  virtual_tour_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA CLIENTS (CRM)
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES auth.users(id),
  
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  interest TEXT DEFAULT 'VENTA',
  status TEXT DEFAULT 'NUEVO',
  preferred_types TEXT[] DEFAULT '{}',
  budget_min DECIMAL(12, 2) DEFAULT 0,
  budget_max DECIMAL(12, 2) DEFAULT 0,
  source TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA CONTRACTS
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  client_id UUID REFERENCES clients(id),
  agent_id UUID REFERENCES auth.users(id),
  
  type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  amount DECIMAL(12, 2),
  signed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA SALES
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  client_id UUID REFERENCES clients(id),
  agent_id UUID REFERENCES auth.users(id),
  contract_id UUID REFERENCES contracts(id),
  
  final_price DECIMAL(12, 2),
  commission DECIMAL(12, 2),
  date_closed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA FOLLOW_UPS
CREATE TABLE follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RLS POLICIES (Seguridad)
-- =============================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES (Basico)
CREATE POLICY "Public profiles can be read by auth users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. AGENCIES
-- Dueños ven su agencia
CREATE POLICY "Owners manage own agency" ON agencies
  FOR ALL USING (owner_id = auth.uid());
  
-- Empleados ven su agencia asignada
CREATE POLICY "Employees view assigned agency" ON agencies
  FOR SELECT USING (id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- 3. PROPERTIES
-- Ver: Si pertenece a mi agencia
CREATE POLICY "View Agency Properties" ON properties
  FOR SELECT USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Editar: Solo si es mi propiedad o soy manager/owner
CREATE POLICY "Manage Agency Properties" ON properties
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) AND
    (
      agent_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('agency_owner', 'branch_manager')
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-Profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (NEW.id, NEW.email, 'agency_owner', SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

```

---

## Paso 5: Configurar Storage

1. Ve a **Storage** en Supabase
2. Click "New bucket"
3. Nombre: `properties`
4. Marca "Public bucket" ✓
5. Click "Create bucket"

---

## Paso 6: Crear Usuario de Prueba

1. Ve a **Authentication > Users**
2. Click "Add user"
3. Configura:
   - **Email**: `demo@inmuebleiapro.local`
   - **Password**: `demo123`
4. Click "Create user"

Ahora puedes iniciar sesión con:
- **ID de Agencia**: `demo`
- **Contraseña**: `demo123`

---

## Paso 7: Reiniciar el servidor

Después de crear `.env.local`, reinicia el servidor de desarrollo:

```bash
npm run dev
```
