
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, PartCategory, Part } from "../types";

const CATEGORIES_LIST = Object.values(PartCategory).join(", ");

const getRegionalInfo = (location: string) => {
  const loc = location.toLowerCase();
  const isMexico = loc.includes("mexico") || loc.includes("mx") || loc.includes("torreon") || loc.includes("mty") || loc.includes("monterrey") || loc.includes("coahuila");
  return {
    currency: isMexico ? "MXN (Pesos Mexicanos)" : "USD (Dólares)",
    shortCurrency: isMexico ? "MXN" : "USD",
    country: isMexico ? "México" : "USA",
    market: isMexico ? "mercado de México" : "mercado de Texas (USA)",
    isMexico
  };
};

const getSystemInstruction = (businessName: string, location: string) => {
  const reg = getRegionalInfo(location);
  return `Actúa como el sistema operativo inteligente de ${businessName}. 
Tu función es el ANÁLISIS MULTIMODAL EXHAUSTIVO. 

REGLAS DE ORO:
1. DEBES analizar TODAS las imágenes proporcionadas. 
2. Si detectas piezas de DIFERENTES vehículos, crea un grupo independiente para cada vehículo en el array 'groups'.
3. Si todas las fotos son del mismo vehículo, devuelve un solo grupo con todas las piezas identificadas.
4. EXTRACCIÓN DE VIN: Eres un experto en OCR. Busca activamente placas de VIN en el tablero, stickers en marcos de puertas, códigos de barras o placas de metal. 
   - SI ENCUENTRAS UN VIN: Analiza sus especificaciones técnicas (Motor, Tracción, Transmisión, Acabado). 
   - Incluye esta información en el campo "trim" del vehículo y añade detalles relevantes al nombre de las piezas (ej: "Motor 5.7L V8" en lugar de solo "Motor").
5. PRECIOS: Usa estándares del ${reg.market} (${location}). Los precios están en ${reg.currency}.
6. CATEGORÍAS: Usa exclusivamente: [${CATEGORIES_LIST}].

Responde SIEMPRE con un JSON que contenga un array llamado 'groups'.`;
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    groups: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          vehicle: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.NUMBER },
              make: { type: Type.STRING },
              model: { type: Type.STRING },
              trim: { type: Type.STRING },
              vin: { type: Type.STRING }
            },
            required: ["year", "make", "model"]
          },
          parts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                condition: { type: Type.STRING },
                suggestedPrice: { type: Type.NUMBER },
                minPrice: { type: Type.NUMBER }
              },
              required: ["name", "category", "condition", "suggestedPrice", "minPrice"]
            }
          }
        },
        required: ["vehicle", "parts"]
      }
    }
  },
  required: ["groups"]
};

export async function analyzeVehicleMedia(base64Images: string[], businessName: string, location: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
          text: `Analiza este set de imágenes. Identifica cada vehículo presente y cataloga todas las piezas visibles. Si hay varios coches, agrúpalos por vehículo. Responde solo con JSON según el esquema de 'groups'.`
        }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(businessName, location),
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA as any
    }
  });

  try {
    const parsed = JSON.parse(response.text || '{"groups":[]}');
    return parsed as AnalysisResult;
  } catch (e) {
    console.error("Error parsing AI response", e);
    return { groups: [] };
  }
}

export async function generateFacebookAd(part: Part, lang: 'es' | 'en', businessName: string, location: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  const reg = getRegionalInfo(location);
  const prompt = `Genera un anuncio de venta persuasivo para Facebook Marketplace. 
  Parte: ${part.name}
  Vehículo: ${part.vehicleInfo.year} ${part.vehicleInfo.make} ${part.vehicleInfo.model}
  Condición: ${part.condition}
  Precio: $${part.suggestedPrice} ${reg.shortCurrency}
  Ubicación: ${location} (${businessName})
  
  Estructura:
  1. Título llamativo.
  2. Descripción detallada con puntos clave.
  3. Menciona que es una parte original probada en ${reg.country}.
  4. Incluye emojis relevantes.
  5. Hashtags como #${businessName.replace(/\s+/g, '')} #PartesUsadas #Autopartes.
  Idioma: ${lang === 'es' ? 'Español' : 'English'}.
  Responde SOLO con el texto del anuncio.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: `Eres un experto en marketing de autopartes usadas en Texas para ${businessName}. Creas anuncios efectivos y profesionales.`
    }
  });

  return response.text || '';
}

export async function searchPartsExternally(query: string, location: string): Promise<{ text: string; sources: any[] }> {
  console.log("AI: Searching externally for:", query);
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) throw new Error("Missing API Key");

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Busca la autoparte "${query}" cerca de ${location}.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text || '',
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Grounding Search failed, trying without tools:", error);
    const fallbackResponse = await ai.models.generateContent({
      model,
      contents: `Proporciona información sobre la autoparte "${query}" cerca de ${location} basándote en tu conocimiento interno.`
    });
    return {
      text: fallbackResponse.text || 'Error en búsqueda externa.',
      sources: []
    };
  }
}

export async function analyzePartText(query: string, businessName: string, location: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model,
    contents: `Catalogar: "${query}". Usa categorías: ${CATEGORIES_LIST}.`,
    config: {
      systemInstruction: getSystemInstruction(businessName, location),
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA as any
    }
  });

  try {
    return JSON.parse(response.text || '{"groups":[]}') as AnalysisResult;
  } catch (e) {
    return { groups: [] };
  }
}
export async function getMarketPriceInsight(part: Part, location: string): Promise<string> {
  console.log("AI: Getting market insight for:", part.name);
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) throw new Error("Missing API Key");

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';
  const reg = getRegionalInfo(location);
  const prompt = `Busca precios actuales de mercado en ${reg.market} (especialmente en ${location}) para la pieza: ${part.name} de un ${part.vehicleInfo.year} ${part.vehicleInfo.make} ${part.vehicleInfo.model}.
  El precio actual en el inventario es $${part.suggestedPrice} ${reg.shortCurrency}.
  Analiza si el precio es competitivo considerando que estamos en ${reg.country} y devuelve un resumen breve (max 3 frases) con el promedio de mercado y una recomendación.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres un experto en valuación de autopartes usadas. Tu objetivo es ayudar a maximizar el margen de beneficio basándote en datos reales de mercado."
      }
    });
    return response.text || '';
  } catch (error) {
    console.warn("Market insight grounding failed, trying fallback:", error);
    try {
      const fallbackResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "Eres un experto en valuación de autopartes. Estás en modo offline, usa tus conocimientos previos para estimar la competitividad del precio."
        }
      });
      return fallbackResponse.text || 'Análisis no disponible actualmente.';
    } catch (finalErr) {
      console.error("AI Insight complete failure:", finalErr);
      return "Error al consultar la IA.";
    }
  }
}

export async function getStagnantStrategy(part: Part, location: string): Promise<string> {
  console.log("AI: Getting stagnant strategy for:", part.name);
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) throw new Error("Missing API Key");

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';
  const reg = getRegionalInfo(location);
  const prompt = `La pieza "${part.name}" de un ${part.vehicleInfo.year} ${part.vehicleInfo.make} ${part.vehicleInfo.model} lleva más de 90 días sin venderse.
  Precio actual: $${part.suggestedPrice} ${reg.shortCurrency}.
  Ubicación: ${location} (${reg.country}).
  Genera una estrategia de liquidación rápida adecuada para el ${reg.market}. 
  Menciona: 
  1. Un nuevo precio sugerido en ${reg.shortCurrency}.
  2. Un enfoque diferente para el anuncio (qué resaltar).
  3. Por qué crees que no se ha vendido considerando el contexto local.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres un estratega de ventas para yonkes (desguaces) en Texas. Eres agresivo para liberar capital pero inteligente para no perder dinero."
      }
    });

    return response.text || '';
  } catch (error) {
    console.warn("Stagnant strategy grounding failed, trying fallback:", error);
    try {
      const fallbackResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "Eres un estratega de ventas. Modo offline: usa tus conocimientos para sugerir una liquidación rápida."
        }
      });
      return fallbackResponse.text || 'Estrategia no disponible.';
    } catch (finalErr) {
      console.error("AI Strategy complete failure:", finalErr);
      return "Error al generar estrategia.";
    }
  }
}
