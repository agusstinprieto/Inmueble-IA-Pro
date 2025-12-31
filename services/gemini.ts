
import { GoogleGenAI, Type } from "@google/genai";
import { PropertyAnalysis, Property, MarketAnalysis, PropertyType } from "../types";

// ============ CONFIGURACIÓN REGIONAL ============

const getRegionalInfo = (location: string) => {
  const loc = location.toLowerCase();
  const isMexico = loc.includes("mexico") || loc.includes("mx") || loc.includes("torreon") ||
    loc.includes("mty") || loc.includes("monterrey") || loc.includes("coahuila") ||
    loc.includes("cdmx") || loc.includes("guadalajara") || loc.includes("df");
  return {
    currency: isMexico ? "MXN (Pesos Mexicanos)" : "USD (Dólares)",
    shortCurrency: isMexico ? "MXN" : "USD",
    country: isMexico ? "México" : "USA",
    market: isMexico ? "mercado inmobiliario de México" : "mercado inmobiliario de USA",
    isMexico
  };
};

// ============ INSTRUCCIONES DEL SISTEMA ============

const getPropertySystemInstruction = (businessName: string, location: string) => {
  const reg = getRegionalInfo(location);
  return `Eres el sistema de inteligencia artificial de ${businessName}, una plataforma inmobiliaria profesional.
Tu función es el ANÁLISIS MULTIMODAL de propiedades inmobiliarias.

REGLAS:
1. Analiza TODAS las imágenes proporcionadas de la propiedad.
2. Identifica el TIPO de propiedad: CASA, DEPARTAMENTO, TERRENO, LOCAL, OFICINA, BODEGA, RANCHO, EDIFICIO.
3. Estima las ESPECIFICACIONES: m² aproximados, número de recámaras, baños, estacionamientos, niveles.
4. Detecta AMENIDADES visibles: alberca, jardín, terraza, gimnasio, elevador, seguridad, etc.
5. Evalúa la CONDICIÓN: NUEVA, EXCELENTE, BUENA, REGULAR, REQUIERE_REPARACION.
6. PRECIOS: Usa valores del ${reg.market} para ${location}. Moneda: ${reg.currency}.
7. Proporciona un RANGO de precio (mínimo y máximo) basado en las características.
8. Incluye SUGERENCIAS para mejorar el valor de la propiedad.

Responde SIEMPRE con JSON válido según el esquema proporcionado.`;
};

// ============ SCHEMAS ============

const PROPERTY_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    properties: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          estimatedSpecs: {
            type: Type.OBJECT,
            properties: {
              m2Total: { type: Type.NUMBER },
              m2Built: { type: Type.NUMBER },
              bedrooms: { type: Type.NUMBER },
              bathrooms: { type: Type.NUMBER },
              halfBathrooms: { type: Type.NUMBER },
              parking: { type: Type.NUMBER },
              floors: { type: Type.NUMBER }
            }
          },
          condition: { type: Type.STRING },
          detectedAmenities: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedPrice: { type: Type.NUMBER },
          priceRange: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER }
            }
          },
          marketComparison: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["type", "estimatedSpecs", "condition", "detectedAmenities", "estimatedPrice", "priceRange"]
      }
    }
  },
  required: ["properties"]
};

// ============ FUNCIONES DE ANÁLISIS ============

export async function analyzePropertyImages(
  base64Images: string[],
  businessName: string,
  location: string
): Promise<{ properties: PropertyAnalysis[] }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured');
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  const imageParts = base64Images.map(img => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: img
    }
  }));

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        ...imageParts,
        {
          text: `Analiza estas imágenes de una propiedad inmobiliaria. Identifica el tipo de propiedad, estima sus especificaciones (m², recámaras, baños, etc.), detecta amenidades, evalúa la condición y proporciona un precio estimado de mercado.`
        }
      ]
    },
    config: {
      systemInstruction: getPropertySystemInstruction(businessName, location),
      responseMimeType: "application/json",
      responseSchema: PROPERTY_ANALYSIS_SCHEMA as any
    }
  });

  try {
    const parsed = JSON.parse(response.text || '{"properties":[]}');
    return parsed;
  } catch (e) {
    console.error("Error parsing AI response", e);
    return { properties: [] };
  }
}

// ============ VALUACIÓN AUTOMÁTICA ============

export async function getPropertyValuation(
  property: Partial<Property>,
  location: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const reg = getRegionalInfo(location);

  const prompt = `Realiza una valuación profesional para esta propiedad:
  Tipo: ${property.type}
  Ubicación: ${property.address?.colony}, ${property.address?.city}
  m² Terreno: ${property.specs?.m2Total}
  m² Construcción: ${property.specs?.m2Built}
  Recámaras: ${property.specs?.bedrooms}
  Baños: ${property.specs?.bathrooms}
  Estacionamiento: ${property.specs?.parking}
  Amenidades: ${property.amenities?.join(', ')}
  
  Mercado: ${reg.market}
  Moneda: ${reg.currency}
  
  Proporciona:
  1. Precio estimado de venta
  2. Precio por m²
  3. Rango de precio (mín - máx)
  4. Comparación con el mercado de la zona
  5. Factores que afectan el valor`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres un valuador inmobiliario profesional certificado. Usa datos reales de mercado."
      }
    });
    return response.text || '';
  } catch (error) {
    console.warn("Valuation with search failed, using fallback:", error);
    const fallback = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "Eres un valuador inmobiliario. Estima el valor basándote en tu conocimiento del mercado."
      }
    });
    return fallback.text || 'Valuación no disponible.';
  }
}

// ============ COMPARADOR DE MERCADO ============

export async function searchSimilarProperties(
  property: Partial<Property>,
  location: string
): Promise<MarketAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const reg = getRegionalInfo(location);

  const prompt = `Busca propiedades similares en el mercado de ${location}:
  Tipo: ${property.type}
  m² aproximados: ${property.specs?.m2Built || property.specs?.m2Total}
  Recámaras: ${property.specs?.bedrooms}
  Zona: ${property.address?.colony}
  
  Encuentra al menos 5 propiedades similares con precios actuales.
  Proporciona el precio promedio, rango de precios y una recomendación de precio competitivo.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres un analista de mercado inmobiliario. Busca propiedades reales en venta."
      }
    });

    // Parse response into structured data
    return {
      averagePrice: 0,
      averagePricePerM2: 0,
      priceRange: { min: 0, max: 0 },
      comparableProperties: [],
      recommendation: response.text || ''
    };
  } catch (error) {
    console.error("Market search failed:", error);
    return {
      averagePrice: 0,
      averagePricePerM2: 0,
      priceRange: { min: 0, max: 0 },
      comparableProperties: [],
      recommendation: "Análisis de mercado no disponible."
    };
  }
}

// ============ GENERADOR DE ANUNCIOS ============

export async function generatePropertyListing(
  property: Property,
  lang: 'es' | 'en',
  businessName: string,
  location: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const reg = getRegionalInfo(location);

  const operationText = property.operation === 'VENTA' ? 'venta' : 'renta';
  const price = property.operation === 'VENTA' ? property.salePrice : property.rentPrice;

  const prompt = `Genera un anuncio inmobiliario profesional y persuasivo:
  
  Propiedad: ${property.title}
  Tipo: ${property.type}
  Operación: ${operationText}
  Precio: $${price?.toLocaleString()} ${reg.shortCurrency}${property.operation === 'RENTA' ? '/mes' : ''}
  
  Ubicación: ${property.address.colony}, ${property.address.city}
  
  Características:
  - ${property.specs.m2Total} m² terreno
  - ${property.specs.m2Built} m² construcción
  - ${property.specs.bedrooms} recámaras
  - ${property.specs.bathrooms} baños
  - ${property.specs.parking} estacionamientos
  
  Amenidades: ${property.amenities.join(', ')}
  
  Descripción actual: ${property.description}
  
  Estructura del anuncio:
  1. Título llamativo y profesional
  2. Descripción atractiva destacando beneficios
  3. Lista de características principales
  4. Llamada a la acción
  5. Hashtags relevantes para redes sociales
  
  Inmobiliaria: ${businessName}
  Idioma: ${lang === 'es' ? 'Español' : 'English'}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: `Eres un experto en marketing inmobiliario de ${businessName}. Creas anuncios que generan leads de calidad.`
    }
  });

  return response.text || '';
}

// ============ ANÁLISIS DE TEXTO ============

export async function analyzePropertyText(
  description: string,
  businessName: string,
  location: string
): Promise<{ properties: PropertyAnalysis[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model,
    contents: `Analiza esta descripción de propiedad y extrae la información: "${description}"`,
    config: {
      systemInstruction: getPropertySystemInstruction(businessName, location),
      responseMimeType: "application/json",
      responseSchema: PROPERTY_ANALYSIS_SCHEMA as any
    }
  });

  try {
    return JSON.parse(response.text || '{"properties":[]}');
  } catch (e) {
    return { properties: [] };
  }
}

// ============ SUGERENCIAS DE MEJORA ============

export async function getImprovementSuggestions(
  property: Property,
  location: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const reg = getRegionalInfo(location);

  const prompt = `Como experto en valorización inmobiliaria, analiza esta propiedad y sugiere mejoras para aumentar su valor:
  
  Tipo: ${property.type}
  Precio actual: $${property.salePrice?.toLocaleString()} ${reg.shortCurrency}
  m²: ${property.specs.m2Built}
  Recámaras: ${property.specs.bedrooms}
  Baños: ${property.specs.bathrooms}
  Amenidades actuales: ${property.amenities.join(', ')}
  Condición: Ver descripción
  
  Descripción: ${property.description}
  
  Proporciona:
  1. Top 5 mejoras con mayor ROI
  2. Costo estimado de cada mejora (en ${reg.shortCurrency})
  3. Aumento de valor esperado
  4. Prioridad de implementación`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "Eres un consultor inmobiliario especializado en home staging y valorización de propiedades."
    }
  });

  return response.text || '';
}

// ============ DESCRIPCIÓN AUTOMÁTICA ============

export async function generatePropertyDescription(
  property: Partial<Property>,
  lang: 'es' | 'en'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  const prompt = `Genera una descripción profesional para esta propiedad:
  Tipo: ${property.type}
  Ubicación: ${property.address?.colony}, ${property.address?.city}
  m² Terreno: ${property.specs?.m2Total}
  m² Construcción: ${property.specs?.m2Built}
  Recámaras: ${property.specs?.bedrooms}
  Baños: ${property.specs?.bathrooms}
  Estacionamiento: ${property.specs?.parking}
  Amenidades: ${property.amenities?.join(', ')}
  
  La descripción debe ser:
  - Profesional y atractiva
  - Destacar los puntos fuertes
  - 150-200 palabras
  - Idioma: ${lang === 'es' ? 'Español' : 'English'}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "Eres un copywriter especializado en bienes raíces de lujo."
    }
  });

  return response.text || '';
}
