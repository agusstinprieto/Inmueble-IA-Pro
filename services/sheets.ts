/// <reference types="vite/client" />
import { Property, Client } from '../types';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';

/**
 * Agrega una propiedad a Google Sheets mediante un script de Google Apps Script.
 */
export const appendPropertyToSheets = async (property: Property, agencySheetsUrl?: string): Promise<boolean> => {
    const targetUrl = agencySheetsUrl || GOOGLE_SCRIPT_URL;

    if (!targetUrl) {
        console.warn('⚠️ Google Sheets URL no configurada.');
        return false;
    }

    try {
        const payload = {
            sheet: 'Propiedades',
            data: {
                ID: property.id,
                País: property.address.country,
                Moneda: property.currency,
                Título: property.title,
                Ciudad: property.address.city,
                Colonia: property.address.colony,
                Tipo: property.type,
                Operación: property.operation,
                Precio: property.operation === 'VENTA' ? property.salePrice : property.rentPrice,
                'M2 Terreno': property.specs?.m2Total || 0,
                'M2 Const': property.specs?.m2Built || 0
            }
        };

        console.log('📤 Enviando a Sheets:', payload);
        console.log('🔗 URL:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('✅ Enviado a Sheets (no-cors mode)');
        return true; // mode no-cors no permite leer la respuesta, pero asume éxito si no hay error
    } catch (error) {
        console.error('❌ Error appending property to Sheets:', error);
        return false;
    }
};

/**
 * Agrega un cliente a Google Sheets.
 */
export const appendClientToSheets = async (client: Client, agencySheetsUrl?: string): Promise<boolean> => {
    const targetUrl = agencySheetsUrl || GOOGLE_SCRIPT_URL;

    // Basic validation to prevent fetching self (Vercel) or invalid URLs
    if (!targetUrl || !targetUrl.includes('script.google.com')) {
        if (targetUrl) console.warn('⚠️ URL de Google Sheets inválida (debe ser script.google.com):', targetUrl);
        return false;
    }

    try {
        const payload = {
            sheet: 'Clientes',
            data: {
                Nombre: client.name,
                País_Interés: client.interest === 'VENTA' ? 'MEXICO' : 'USA', // Simplificado para demo
                Ciudad: client.preferredZones[0] || '',
                Colonia: client.preferredZones[1] || '',
                Presupuesto: client.budgetMax
            }
        };

        await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        return true;
    } catch (error) {
        console.error('Error appending client to Sheets:', error);
        return false;
    }
};
