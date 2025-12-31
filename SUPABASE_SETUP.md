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
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

---

## Paso 3: Crear archivo .env.local

Crea el archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...tu_clave_aqui
```

---

## Paso 4: Ejecutar SQL en Supabase

Ve a **SQL Editor** en Supabase y ejecuta este script:

```sql
-- =============================================
-- INMUEBLE IA PRO - Database Schema
-- =============================================

-- 1. TABLA PROFILES (usuarios/agencias)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_id TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  location TEXT DEFAULT '',
  script_url TEXT DEFAULT '',
  branding_color TEXT DEFAULT '#f59e0b',
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA PROPERTIES (propiedades)
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
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
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  m2_total INTEGER DEFAULT 0,
  m2_built INTEGER DEFAULT 0,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  floors INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  sale_price DECIMAL(12, 2) DEFAULT 0,
  rent_price DECIMAL(12, 2) DEFAULT 0,
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  agent_id UUID,
  agency_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA CLIENTS (clientes/leads)
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  interest TEXT DEFAULT 'VENTA',
  preferred_types TEXT[] DEFAULT '{}',
  budget_min DECIMAL(12, 2) DEFAULT 0,
  budget_max DECIMAL(12, 2) DEFAULT 0,
  preferred_zones TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'NUEVO',
  source TEXT,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA FOLLOW_UPS (seguimientos)
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA CONTRACTS (contratos)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  property_id UUID REFERENCES properties(id),
  client_id UUID REFERENCES clients(id),
  type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  amount DECIMAL(12, 2),
  deposit DECIMAL(12, 2),
  terms TEXT,
  signed BOOLEAN DEFAULT FALSE,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA SALES (ventas/rentas cerradas)
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  client_id UUID REFERENCES clients(id),
  contract_id UUID REFERENCES contracts(id),
  final_price DECIMAL(12, 2),
  commission DECIMAL(12, 2),
  date_closed TIMESTAMP WITH TIME ZONE,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para PROPERTIES
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para CLIENTS
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para FOLLOW_UPS (heredan del cliente)
CREATE POLICY "Users can manage follow_ups" ON follow_ups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = follow_ups.client_id AND clients.user_id = auth.uid())
  );

-- Políticas para CONTRACTS
CREATE POLICY "Users can manage contracts" ON contracts
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para SALES
CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = sales.property_id AND properties.user_id = auth.uid())
  );

-- =============================================
-- TRIGGER: Crear perfil automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_id, business_name)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    SPLIT_PART(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
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
   - **Password**: `demo123456`
4. Click "Create user"

Ahora puedes iniciar sesión con:
- **ID de Agencia**: `demo`
- **Contraseña**: `demo123456`

---

## Paso 7: Reiniciar el servidor

Después de crear `.env.local`, reinicia el servidor de desarrollo:

```bash
npm run dev
```
