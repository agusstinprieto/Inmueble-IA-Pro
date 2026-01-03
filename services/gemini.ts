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

// ============ MODEL FALLBACK STRATEGY ============

// List of models to try in order of preference/reliability
// VERIFIED AVAILABLE MODELS for this API Key:
// - gemini-2.5-flash
// - gemini-2.0-flash
// - gemini-2.0-flash-exp
// - gemini-2.0-flash-001
const FALLBACK_MODELS = [
  'gemini-2.5-flash',      // Primary (Newest/Stable)
  'gemini-2.0-flash',      // Secondary
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-exp',  // Experimental (use as fallback)
  'gemini-3-flash-preview' // Bleeding edge
];

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any,
    config?: any
  }
): Promise<any> {
  let lastError;

  for (const modelName of FALLBACK_MODELS) {
    try {
      // console.log(`Attempting generation with model: ${modelName}`);
      const result = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config
      });

      return result;
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      // Continue to next model if 404 (Not Found) or 429 (Too Many Requests/Quota)
      // or 503 (Service Unavailable)
      if (
        error.message.includes('404') ||
        error.message.includes('429') ||
        error.message.includes('not found') ||
        error.message.includes('quota') ||
        error.message.includes('503')
      ) {
        lastError = error;
        continue;
      }
      // If it's a different error (e.g. invalid prompt), throw immediately
      throw error;
    }
  }

  throw new Error(`All AI models failed. Please check API Key or Quota. Last error: ${lastError?.message}`);
}


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

const VALUATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    currency: { type: Type.STRING },
    estimatedPrice: { type: Type.NUMBER },
    priceRange: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.NUMBER },
        max: { type: Type.NUMBER }
      }
    },
    pricePerM2: { type: Type.NUMBER },
    marketTrend: { type: Type.STRING },
    marketConfidence: { type: Type.NUMBER },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["currency", "estimatedPrice", "priceRange", "pricePerM2", "marketTrend", "marketConfidence", "suggestions"]
};

const PROPERTY_EXTRACT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    type: { type: Type.STRING },
    operation: { type: Type.STRING },
    description: { type: Type.STRING },
    price: { type: Type.NUMBER },
    currency: { type: Type.STRING },
    m2Total: { type: Type.NUMBER },
    m2Built: { type: Type.NUMBER },
    bedrooms: { type: Type.NUMBER },
    bathrooms: { type: Type.NUMBER },
    parking: { type: Type.NUMBER },
    floors: { type: Type.NUMBER },
    amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
    address: {
      type: Type.OBJECT,
      properties: {
        street: { type: Type.STRING },
        exteriorNumber: { type: Type.STRING },
        colony: { type: Type.STRING },
        city: { type: Type.STRING },
        state: { type: Type.STRING },
        zipCode: { type: Type.STRING },
        country: { type: Type.STRING }
      }
    }
  },
  required: ["title", "type", "operation", "price"]
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

  const imageParts = base64Images.map(img => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: img
    }
  }));

  try {
    const response = await generateWithFallback(ai, {
      contents: {
        role: 'user',
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
  } catch (error) {
    console.error("Analysis failed:", error);
    return { properties: [] };
  }
}

// ============ VALUACIÓN AUTOMÁTICA ============

export async function getPropertyValuation(
  propertyData: any, // Use any for raw form data
  location: string
): Promise<any> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not found');

  const ai = new GoogleGenAI({ apiKey });
  const reg = getRegionalInfo(location);

  const prompt = `Realiza una valuación inmobiliaria profesional y un estudio de mercado para:
  Tipo: ${propertyData.propertyType}
  Ubicación: ${propertyData.neighborhood}, ${propertyData.city} (${propertyData.country})
  m² Terreno: ${propertyData.m2Total}
  m² Construcción: ${propertyData.m2Built}
  Recámaras: ${propertyData.bedrooms}
  Baños: ${propertyData.bathrooms}
  Condición: ${propertyData.condition}
  Amenidades: ${propertyData.amenities}
  
  CONTEXTO:
  1. Usa Google Search para encontrar precios reales de mercado en ${propertyData.neighborhood}, ${propertyData.city}.
  2. La moneda debe ser: ${reg.currency}.
  3. Estima el precio total, rango y precio por m².
  4. Analiza la tendencia de la zona (UP/DOWN/STABLE).
  5. Califica la confianza del análisis (0.0 a 1.0).
  6. Proporciona insights y sugerencias de mejora.`;

  try {
    const response = await generateWithFallback(ai, {
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} } as any],
        systemInstruction: "Eres un perito valuador inmobiliario internacional con acceso a datos de mercado en tiempo real.",
        responseMimeType: "application/json",
        responseSchema: VALUATION_SCHEMA as any
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Valuation failed:", error);
    throw error;
  }
}

// ============ COMPARADOR DE MERCADO ============

export async function searchSimilarProperties(
  property: Partial<Property>,
  location: string
): Promise<MarketAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const reg = getRegionalInfo(location);

  const prompt = `Busca propiedades similares en el mercado de ${location}:
  Tipo: ${property.type}
  m² aproximados: ${property.specs?.m2Built || property.specs?.m2Total}
  Recámaras: ${property.specs?.bedrooms}
  Zona: ${property.address?.colony}
  
  Encuentra al menos 5 propiedades similares con precios actuales.
  Proporciona el precio promedio, rango de precios y una recomendación de precio competitivo.`;

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres un analista de mercado inmobiliario. Busca propiedades reales en venta."
      }
    });

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
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

  const response = await generateWithFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction: `Eres un experto en marketing inmobiliario de ${businessName}. Creas anuncios que generan leads de calidad.`
    }
  });

  return response.text || '';
}

// ============ GENERADOR DE ADS SOCIALES ============

export async function generateSocialAd(
  property: Property,
  platform: 'facebook' | 'whatsapp',
  businessName: string,
  location: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const reg = getRegionalInfo(location);

  const operationText = property.operation === 'VENTA' ? 'venta' : 'renta';
  const price = property.operation === 'VENTA' ? property.salePrice : property.rentPrice;

  let prompt = '';

  if (platform === 'facebook') {
    prompt = `Genera un anuncio para FACEBOOK Marketplace y Grupos Inmobiliarios:
    
    Propiedad: ${property.title}
    Tipo: ${property.type}
    Precio: $${price?.toLocaleString()} ${reg.shortCurrency}
    Ubicación: ${property.address.colony}, ${property.address.city}

    Características:
    - ${property.specs.bedrooms} Recámaras
    - ${property.specs.bathrooms} Baños
    - ${property.specs.parking} Autos

    ESTILO FACEBOOK:
    - Usa MUCHOS emojis llamativos (🏠, 🔥, 📍, 💰).
    - Empieza con un GANCHO fuerte (Ej: "¡Oportunidad Única!", "¡Tu Nuevo Hogar te Espera!").
    - Lista de beneficios usando viñetas (✅).
    - Precio claro.
    - Llamada a la acción persuasiva ("Envía inbox", "Agenda cita hoy").
    - Bloque de hashtags al final (#bienesraices #${property.address.city.replace(/\s/g, '')} #inmobiliaria).
    
    Inmobiliaria: ${businessName}`;
  } else {
    prompt = `Genera un mensaje para WHATSAPP (formato lista de difusión):

    Propiedad: ${property.title}
    Ubicación: ${property.address.colony}
    Precio: $${price?.toLocaleString()} ${reg.shortCurrency}

    ESTILO WHATSAPP:
    - Corto y directo (lectura rápida).
    - Usa negritas con asteriscos (Ej: *Precio:*).
    - Emojis clave pero no excesivos.
    - Destaca: Ubicación, Precio y 3 Puntos clave.
    - Cierre con pregunta o invitación directa ("¿Te envío fotos?", "¿Agendamos visita?").
    - Sin hashtags.
    
    Inmobiliaria: ${businessName}`;
  }

  const response = await generateWithFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction: "Eres un experto en Community Management inmobiliario. Tu objetivo es generar clics y mensajes."
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await generateWithFallback(ai, {
      contents: `Analiza esta descripción de propiedad y extrae la información: "${description}"`,
      config: {
        systemInstruction: getPropertySystemInstruction(businessName, location),
        responseMimeType: "application/json",
        responseSchema: PROPERTY_ANALYSIS_SCHEMA as any
      }
    });

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
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

  const response = await generateWithFallback(ai, {
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

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

  const response = await generateWithFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction: "Eres un copywriter especializado en bienes raíces de lujo."
    }
  });

  return response.text || '';
}

// ============ EXTRACCIÓN DESDE URL (SCRAPING IA) ============

export async function extractPropertyFromHtml(
  html: string,
  businessName: string,
  location: string
): Promise<Partial<Property> | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  // Clean HTML to reduce noise
  const cleanHtml = html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const prompt = `Analiza este HTML de un portal inmobiliario y extrae la información de la propiedad.
  Busca en metadatos (og:title, description), JSON-LD schemas y el contenido visible.

  HTML:
  ${cleanHtml.substring(0, 150000)}
  `;

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: `Eres un extractor de datos experto. Extrae la información de la propiedad del HTML proporcionado. 
        Mapea el tipo a: CASA, DEPARTAMENTO, TERRENO, LOCAL, OFICINA, BODEGA, RANCHO, EDIFICIO.
        Mapea la operación a: VENTA, RENTA.
        
        Prioriza encontrar:
        1. Precio (busca "MXN", "$", "USD")
        2. Ubicación (Colonia, Ciudad, PAÍS: usa "USA" o "MEXICO")
        3. Metros cuadrados (Terreno y Construcción)
        4. Habitaciones y Baños
        
        Si no encuentras un campo específico, omítelo del JSON.`,
        responseMimeType: "application/json",
        responseSchema: PROPERTY_EXTRACT_SCHEMA as any
      }
    });

    const data = JSON.parse(response.text || '{}');
    if (!data.title) return null;

    return {
      title: data.title,
      type: data.type as any,
      operation: data.operation as any,
      description: data.description,
      salePrice: data.operation === 'VENTA' ? data.price : 0,
      rentPrice: data.operation === 'RENTA' ? data.price : 0,
      address: {
        street: data.address?.street || '',
        exteriorNumber: data.address?.exteriorNumber || '',
        colony: data.address?.colony || '',
        city: data.address?.city || location,
        state: data.address?.state || '',
        zipCode: data.address?.zipCode || '',
        country: data.address?.country || 'MEXICO'
      },
      currency: (data.address?.country === 'USA' || data.currency === 'USD') ? 'USD' : 'MXN',
      amenities: data.amenities || [],
      status: 'DISPONIBLE' as any
    };
  } catch (error) {
    console.error("AI Extraction failed:", error);
    return null;
  }
}

// ============ ASISTENTE CONVERSACIONAL ============

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithAssistant(
  message: string,
  history: AssistantMessage[],
  lang: 'es' | 'en',
  userName?: string,
  agencyName?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = lang === 'es'
    ? `Eres un asistente experto en bienes raíces.
OBJETIVO: Adaptar la longitud de la respuesta al contexto del usuario.
- SALUDOS O FRASES CORTAS: Sé breve, cordial y directo (máximo 2 líneas).
- TEMAS COMPLEJOS (Contratos, Cierres, Legal, Procesos): Sé profundo, educativo y claro. Explica los puntos clave.
- FORMATO: SOLO TEXTO PLANO. PROHIBIDO usar asteriscos (**), negritas o Markdown.
- TONO: Profesional pero cercano. Sé conciso: ni muy breve ni excesivo.
- META: Que el usuario entienda perfectamente sin leer texto de relleno.
${agencyName ? `Representas a la agencia ${agencyName}.` : ''}
${userName ? `Estás hablando con ${userName}.` : ''}`
    : `You are an expert real estate assistant.
OBJECTIVE: Adapt response length to user context.
- GREETINGS/SMALL TALK: Be brief and cordial (max 2 lines).
- COMPLEX TOPICS (Contracts, Closings, Legal): Be deep, educational, and clear. Explain key points.
- FORMAT: PLAIN TEXT ONLY. FORBIDDEN to use asterisks (**), bold, or Markdown.
- TONE: Professional but approachable. Be concise: neither too brief nor excessive.
- GOAL: Ensure perfect understanding without fluff.
${agencyName ? `You represent ${agencyName}.` : ''}
${userName ? `You are talking to ${userName}.` : ''}`;

  // Simplify to single prompt for maximum reliability with this SDK
  const formattedHistory = history.map(msg =>
    `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
  ).join('\n');

  const promptText = `${formattedHistory}\nUsuario: ${message}`;

  try {
    const response = await generateWithFallback(ai, {
      contents: {
        parts: [{ text: promptText }]
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    return response.text || (lang === 'es'
      ? 'Error al generar respuesta.'
      : 'Error generating response.');
  } catch (error) {
    console.error('Assistant chat error:', error);
    throw error;
  }
}
