
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, PartCategory, Part } from "../types";

const CATEGORIES_LIST = Object.values(PartCategory).join(", ");

const getSystemInstruction = (businessName: string, location: string) => `Actúa como el sistema operativo inteligente de ${businessName}. 
Tu función es el ANÁLISIS MULTIMODAL EXHAUSTIVO. 

REGLAS DE ORO:
1. DEBES analizar TODAS las imágenes proporcionadas. 
2. Si detectas piezas de DIFERENTES vehículos, crea un grupo independiente para cada vehículo en el array 'groups'.
3. Si todas las fotos son del mismo vehículo, devuelve un solo grupo con todas las piezas identificadas.
4. EXTRACCIÓN DE VIN: Busca activamente placas de VIN, stickers en marcos de puertas o códigos de barras. Si lo encuentras, asígnalo al vehículo correspondiente.
5. PRECIOS: Usa estándares del mercado de Texas (${location}).
6. CATEGORÍAS: Usa exclusivamente: [${CATEGORIES_LIST}].

Responde SIEMPRE con un JSON que contenga un array llamado 'groups'.`;

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
  const model = 'gemini-3-flash-preview';
  
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
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Genera un anuncio de venta persuasivo para Facebook Marketplace. 
  Parte: ${part.name}
  Vehículo: ${part.vehicleInfo.year} ${part.vehicleInfo.make} ${part.vehicleInfo.model}
  Condición: ${part.condition}
  Precio: $${part.suggestedPrice} USD
  Ubicación: ${location} (${businessName})
  
  Estructura:
  1. Título llamativo.
  2. Descripción detallada con puntos clave.
  3. Menciona que es una parte original probada en Texas.
  4. Incluye emojis relevantes.
  5. Hashtags como #${businessName.replace(/\s+/g, '')} #TexasParts #UsedParts.
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-image-preview'; 
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
}

export async function analyzePartText(query: string, businessName: string, location: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
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
