import { GoogleGenerativeAI } from "@google/generative-ai";
import { PropertyAnalysis, Property, MarketAnalysis, PropertyType } from "../types";
import { checkUsageLimit, incrementUsage, getLimitReachedMessage } from "./usageLimits";

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

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("VITE_GEMINI_API_KEY is not configured");
  return key;
};

// Robust JSON parser for Gemini 2.0 responses
function parseGeminiJson<T>(text: string, defaultValue: T): T {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonString) as T;
    }
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.warn("JSON Parse Fallback triggered", e);
    return defaultValue;
  }
}

// ============ INSTRUCCIONES DEL SISTEMA ============

const getPropertySystemInstruction = (businessName: string, location: string) => {
  const reg = getRegionalInfo(location);
  return `Eres el sistema de inteligencia artificial de ${businessName}, una plataforma inmobiliaria profesional.
Tu función es el ANÁLISIS MULTIMODAL de propiedades inmobiliarias.

REGLAS:
1. Analiza TODAS las imágenes proporcionadas.
2. Identifica el TIPO (CASA, DEPARTAMENTO, etc.).
3. Estima ESPECIFICACIONES (m², recámaras, condition).
4. AMENIDADES visibles.
5. PRECIOS: Usa valores del ${reg.market} para ${location}. Moneda: ${reg.currency}.
6. Estructura JSON válida estrictamente:
   {
     "properties": [
       { "type": "CASA", "estimatedSpecs": {...}, "estimatedPrice": 0 }
     ]
   }`;
};


// ============ FUNCIONES DE ANÁLISIS ============

export async function analyzePropertyImages(
  base64Images: string[],
  businessName: string,
  location: string,
  agencyId?: string,
  userId?: string
): Promise<{ properties: PropertyAnalysis[] }> {
  if (agencyId) {
    const limitCheck = await checkUsageLimit(agencyId, 'propertyAnalysis');
    if (!limitCheck.allowed) {
      throw new Error(getLimitReachedMessage('propertyAnalysis', limitCheck.current, limitCheck.limit));
    }
  }

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getPropertySystemInstruction(businessName, location)
  });

  const imageParts = base64Images.map(img => ({
    inlineData: { mimeType: 'image/jpeg', data: img }
  }));

  try {
    const result = await model.generateContent([
      ...imageParts,
      `Analiza estas imágenes. Identifica tipo, especificaciones, amenidades, condición y precio estimado.
       Responde EXCLUSIVAMENTE con un JSON:
       {
         "properties": [{
           "type": "CASA|DEPT|...",
           "estimatedSpecs": { "m2Total": 0, "m2Built": 0, "bedrooms": 0, "bathrooms": 0, "parking": 0, "floors": 1 },
           "condition": "EXCELENTE|BUENA|REGULAR",
           "detectedAmenities": ["string"],
           "estimatedPrice": 0,
           "priceRange": { "min": 0, "max": 0 },
           "marketComparison": "string",
           "suggestions": ["string"]
         }]
       }`
    ]);

    const parsed = parseGeminiJson(result.response.text(), { properties: [] as PropertyAnalysis[] });

    if (agencyId && userId && parsed.properties.length > 0) {
      await incrementUsage(agencyId, userId, 'propertyAnalysis');
    }

    return parsed;
  } catch (error) {
    console.error("Analysis failed:", error);
    return { properties: [] };
  }
}

// ============ VALUACIÓN AUTOMÁTICA ============

export async function getPropertyValuation(
  propertyData: any,
  location: string
): Promise<any> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const reg = getRegionalInfo(location);

  const prompt = `Valuación Inmobiliaria para: ${propertyData.propertyType} en ${propertyData.neighborhood}, ${propertyData.city}.
    Datos: ${propertyData.m2Total}m2 terreno, ${propertyData.m2Built}m2 const, ${propertyData.bedrooms} rec, ${propertyData.amenities}.
    
    Genera JSON con:
    estimatedPrice (number), priceRange {min, max}, pricePerM2, marketTrend (UP/DOWN/STABLE), marketConfidence (0-1), suggestions (array).
    Moneda: ${reg.currency}.`;

  try {
    const result = await model.generateContent(prompt);
    return parseGeminiJson(result.response.text(), {});
  } catch (error) {
    console.error("Valuation failed:", error);
    return {};
  }
}

// ============ COMPARADOR DE MERCADO ============

export async function searchSimilarProperties(
  property: Partial<Property>,
  location: string
): Promise<MarketAnalysis> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Busca 5 propiedades similares en venta en ${location} para comparar con:
    ${property.type}, ${property.specs?.m2Built}m2, ${property.specs?.bedrooms} recámaras.
    Devuelve un resumen de precios promedio y recomendación.`;

  try {
    const result = await model.generateContent(prompt);
    return {
      averagePrice: 0,
      averagePricePerM2: 0,
      priceRange: { min: 0, max: 0 },
      comparableProperties: [],
      recommendation: result.response.text()
    };
  } catch (error) {
    return {
      averagePrice: 0, averagePricePerM2: 0, priceRange: { min: 0, max: 0 }, comparableProperties: [],
      recommendation: "No disponible."
    };
  }
}

// ============ GENERADOR DE ANUNCIOS ============

export async function generatePropertyListing(
  property: Property,
  lang: 'es' | 'en',
  businessName: string,
  location: string,
  agencyId?: string,
  userId?: string
): Promise<string> {
  if (agencyId) {
    const limitCheck = await checkUsageLimit(agencyId, 'adGeneration');
    if (!limitCheck.allowed) {
      throw new Error(getLimitReachedMessage('adGeneration', limitCheck.current, limitCheck.limit, lang));
    }
  }

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const reg = getRegionalInfo(location);
  const price = property.operation === 'VENTA' ? property.salePrice : property.rentPrice;

  const prompt = `Escribe un anuncio inmobiliario para: ${property.title}.
  Ubicación: ${property.address.colony}, ${property.address.city}.
  Precio: $${price?.toLocaleString()} ${reg.shortCurrency}.
  Specs: ${property.specs.bedrooms} rec, ${property.specs.bathrooms} baños.
  Amenidades: ${property.amenities.join(', ')}.
  Inmobiliaria: ${businessName}.
  Idioma: ${lang === 'es' ? 'Español' : 'English'}.
  Estructura: Título, Descripción emotiva, Lista bullets, Call to Action.`;

  try {
    const result = await model.generateContent(prompt);
    if (agencyId && userId) await incrementUsage(agencyId, userId, 'adGeneration');
    return result.response.text();
  } catch (e) {
    return "";
  }
}

export async function generateSocialAd(
  property: Property,
  platform: 'facebook' | 'whatsapp',
  businessName: string,
  location: string,
  agencyId?: string,
  userId?: string
): Promise<string> {
  if (agencyId) {
    const limitCheck = await checkUsageLimit(agencyId, 'adGeneration');
    if (!limitCheck.allowed) throw new Error(getLimitReachedMessage('adGeneration', limitCheck.current, limitCheck.limit));
  }

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const price = property.operation === 'VENTA' ? property.salePrice : property.rentPrice;

  const prompt = `Genera un anuncio para ${platform.toUpperCase()}:
  Propiedad: ${property.title} (${property.type}).
  Precio: $${price?.toLocaleString()}.
  Ubicación: ${property.address.colony}.
  ${platform === 'facebook' ? 'Usa muchos emojis, bullets y hashtags.' : 'Corto, directo, formato lista, sin hashtags.'}
  Inmobiliaria: ${businessName}.`;

  try {
    const result = await model.generateContent(prompt);
    if (agencyId && userId) await incrementUsage(agencyId, userId, 'adGeneration');
    return result.response.text();
  } catch (e) {
    return "";
  }
}

// ============ ANÁLISIS DE TEXTO ============

export async function analyzePropertyText(
  description: string,
  businessName: string,
  location: string
): Promise<{ properties: PropertyAnalysis[] }> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getPropertySystemInstruction(businessName, location)
  });

  try {
    const result = await model.generateContent(`Analiza texto y extrae datos en JSON: "${description}"`);
    return parseGeminiJson(result.response.text(), { properties: [] });
  } catch (e) {
    return { properties: [] };
  }
}

export async function getImprovementSuggestions(property: Property, location: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent(`Sugerencias de mejora (Home Staging/Remodelación) para: ${property.title} (${property.type}).`);
    return result.response.text();
  } catch (e) {
    return "";
  }
}

export async function generatePropertyDescription(property: Partial<Property>, lang: 'es' | 'en'): Promise<string> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent(`Descripción profesional inmobiliaria (150 palabras) para: ${property.type} en ${property.address?.colony}. Idioma: ${lang}.`);
    return result.response.text();
  } catch (e) {
    return "";
  }
}

// ============ EXTRACCIÓN DESDE URL ============

export async function extractPropertyFromHtml(
  html: string,
  businessName: string,
  location: string
): Promise<Partial<Property> | null> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const cleanHtml = html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  try {
    const result = await model.generateContent([
      `Extrae datos de propiedad de este HTML. JSON con: title, type, operation, price, currency, address (street, colony, city), specs.`,
      cleanHtml.substring(0, 30000) // Limit context
    ]);

    const data = parseGeminiJson<any>(result.response.text(), {});
    if (!data.title) return null;

    return {
      title: data.title,
      type: data.type,
      operation: data.operation,
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
      currency: data.currency || 'MXN',
      amenities: data.amenities || [],
      status: 'DISPONIBLE'
    };
  } catch (error) {
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
  agencyName?: string,
  agencyId?: string,
  userId?: string
): Promise<string> {
  if (agencyId) {
    const limitCheck = await checkUsageLimit(agencyId, 'voiceQueries');
    if (!limitCheck.allowed) throw new Error(getLimitReachedMessage('voiceQueries', limitCheck.current, limitCheck.limit, lang));
  }

  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: lang === 'es'
      ? `Eres un asistente experto en bienes raíces de ${agencyName || 'la agencia'}. Sé breve, profesional y útil.`
      : `You are an expert real estate assistant for ${agencyName || 'the agency'}. Be brief, professional, and helpful.`
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }))
  });

  try {
    const result = await chat.sendMessage(message);
    if (agencyId && userId) await incrementUsage(agencyId, userId, 'voiceQueries').catch(console.error);
    return result.response.text();
  } catch (error) {
    console.error("Chat error:", error);
    return lang === 'es' ? "Error de conexión." : "Connection error.";
  }
}
