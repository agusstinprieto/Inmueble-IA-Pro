-- INMUEBLE IA PRO - Biblioteca Inmobiliaria y Directorio de Notarios

-- 1. Biblioteca Inmobiliaria (Recursos: PDFs, Videos, Cursos)
CREATE TABLE IF NOT EXISTS public.real_estate_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'course', 'link')),
    category TEXT NOT NULL CHECK (category IN ('CONTRACTS', 'MARKETING', 'REQUIREMENTS', 'INFONAVIT', 'SUCCESS_STORIES', 'TRAINING')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Directorio de Notarios
CREATE TABLE IF NOT EXISTS public.notaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notary_number TEXT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.real_estate_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notaries ENABLE ROW LEVEL SECURITY;

-- Public read for resources
CREATE POLICY "Allow public read for real_estate_resources"
ON public.real_estate_resources FOR SELECT
USING (true);

-- Agency-specific access for notaries
CREATE POLICY "Allow authenticated read for all notaries"
ON public.notaries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow agency owners to manage their city notaries"
ON public.notaries FOR ALL
TO authenticated
USING (agency_id = auth.uid() OR agency_id IS NULL); -- Allow public shared notaries

-- Sample Data (Biblioteca)
INSERT INTO public.real_estate_resources (title, type, category, url, description) VALUES
('Contrato de Promesa de Compraventa (PROFECO)', 'pdf', 'CONTRACTS', 'https://finverrdesarrollos.com/wp-content/uploads/2023/10/CONTRATO-DE-ADHESION-PROFECO-PROMESA-DE-COMPRAVENTA-DE-VIVIENDA.pdf', 'Modelo oficial de contrato de adhesión registrado ante PROFECO para compraventa de vivienda.'),
('Checklist: Documentos para Venta de Inmueble', 'pdf', 'REQUIREMENTS', 'https://becerrayasociados.com/wp-content/uploads/2023/04/CHECKLIST-PARA-VENTA.pdf', 'Lista detallada de toda la documentación legal y fiscal requerida para el vendedor y la propiedad.'),
('Tutorial INFONAVIT 2024 - Guía Completa', 'video', 'INFONAVIT', 'https://www.youtube.com/watch?v=b0w2k_P5F5w', 'Aprende cómo funciona el crédito Infonavit en 2024, puntos necesarios y tipos de financiamiento.'),
('Marketing Inmobiliario: Guía para Principiantes', 'video', 'MARKETING', 'https://www.youtube.com/watch?v=j2_y5rQzFfI', 'Estrategias clave para captar clientes y posicionar tu marca personal en el sector inmobiliario en 2024.'),
('Técnicas de Cierre de Ventas Inmobiliarias', 'video', 'TRAINING', 'https://www.youtube.com/watch?v=xvE6xX98X7Y', 'Métodos efectivos para manejar objeciones y cerrar operaciones con éxito.');

-- Sample Data (Notarios Torreón/Gómez/Lerdo)
INSERT INTO public.notaries (name, notary_number, city, address, phone) VALUES
('Notaría Pública 1 - Torreón', '1', 'Torreón', 'Av. Morelos 123, Centro', '8717123456'),
('Notaría Pública 5 - Gómez Palacio', '5', 'Gómez Palacio', 'Calle Independencia 456', '8717156789'),
('Notaría Pública 3 - Lerdo', '3', 'Ciudad Lerdo', 'Av. Madero 789', '8717189012');
