/// <reference types="vite/client" />
import { Property, Client } from '../types';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';

/**
 * Agrega una propiedad a Google Sheets mediante un script de Google Apps Script.
 */
export const appendPropertyToSheets = async (property: Property): Promise<boolean> => {
    if (!GOOGLE_SCRIPT_URL) {
        console.warn('VITE_GOOGLE_SHEETS_URL no configurada.');
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
                'M2 Terreno': property.specs.m2Total,
                'M2 Const': property.specs.m2Built
            }
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        return true; // mode no-cors no permite leer la respuesta, pero asume éxito si no hay error
    } catch (error) {
        console.error('Error appending property to Sheets:', error);
        return false;
    }
};

/**
 * Agrega un cliente a Google Sheets.
 */
export const appendClientToSheets = async (client: Client): Promise<boolean> => {
    if (!GOOGLE_SCRIPT_URL) return false;

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

        await fetch(GOOGLE_SCRIPT_URL, {
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
