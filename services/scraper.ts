
// ============================================
// INMUEBLE IA PRO - Servicio de Importación
// ============================================

import { ImportedProperty, Property, PropertyType, OperationType, PropertyStatus } from '../types';

// ============ PORTALES SOPORTADOS ============

export const SUPPORTED_PORTALS = [
    { id: 'propiedadesmexico', name: 'Propiedades México', url: 'https://www.propiedadesmexico.com' },
    { id: 'inmuebles24', name: 'Inmuebles24', url: 'https://www.inmuebles24.com' },
    { id: 'vivanuncios', name: 'Vivanuncios', url: 'https://www.vivanuncios.com.mx' },
    { id: 'segundamano', name: 'Segunda Mano', url: 'https://www.segundamano.mx' },
    { id: 'metroscubicos', name: 'Metros Cúbicos', url: 'https://www.metroscubicos.com' }
];

// ============ TIPOS ============

interface ScrapedData {
    title: string;
    price: number;
    operation: string;
    type: string;
    location: string;
    m2: number;
    bedrooms: number;
    bathrooms: number;
    parking: number;
    description: string;
    images: string[];
    url: string;
    source: string;
}

// ============ FUNCIONES DE PARSING ============

/**
 * Mapea tipo de propiedad del portal a nuestro enum
 */
function mapPropertyType(type: string): PropertyType {
    const typeMap: Record<string, PropertyType> = {
        'casa': PropertyType.CASA,
        'house': PropertyType.CASA,
        'departamento': PropertyType.DEPARTAMENTO,
        'apartment': PropertyType.DEPARTAMENTO,
        'depto': PropertyType.DEPARTAMENTO,
        'terreno': PropertyType.TERRENO,
        'land': PropertyType.TERRENO,
        'lote': PropertyType.TERRENO,
        'local': PropertyType.LOCAL,
        'comercial': PropertyType.LOCAL,
        'oficina': PropertyType.OFICINA,
        'office': PropertyType.OFICINA,
        'bodega': PropertyType.BODEGA,
        'warehouse': PropertyType.BODEGA,
        'rancho': PropertyType.RANCHO,
        'edificio': PropertyType.EDIFICIO,
        'building': PropertyType.EDIFICIO
    };

    const normalizedType = type.toLowerCase().trim();
    return typeMap[normalizedType] || PropertyType.CASA;
}

/**
 * Mapea operación del portal
 */
function mapOperationType(operation: string): OperationType {
    const opMap: Record<string, OperationType> = {
        'venta': OperationType.VENTA,
        'sale': OperationType.VENTA,
        'renta': OperationType.RENTA,
        'rent': OperationType.RENTA,
        'alquiler': OperationType.RENTA,
        'traspaso': OperationType.TRASPASO
    };

    const normalizedOp = operation.toLowerCase().trim();
    return opMap[normalizedOp] || OperationType.VENTA;
}

/**
 * Extrae número de un string
 */
function extractNumber(str: string): number {
    const match = str.match(/[\d,]+/);
    if (match) {
        return parseInt(match[0].replace(/,/g, ''), 10);
    }
    return 0;
}

/**
 * Parsea ubicación en componentes
 */
function parseLocation(location: string): { colony: string; city: string; state: string } {
    const parts = location.split(',').map(p => p.trim());
    return {
        colony: parts[0] || '',
        city: parts[1] || '',
        state: parts[2] || ''
    };
}

// ============ IMPORTACIÓN MANUAL (URL) ============

/**
 * Importa propiedad desde URL (simulado - requiere backend)
 * En producción, esto llamaría a un servicio backend que hace el scraping
 */
export async function importFromUrl(url: string): Promise<ImportedProperty | null> {
    console.log('Importing from URL:', url);

    // Detectar portal
    let source = 'unknown';
    for (const portal of SUPPORTED_PORTALS) {
        if (url.includes(portal.url.replace('https://', '').replace('www.', ''))) {
            source = portal.id;
            break;
        }
    }

    // NOTA: En una implementación real, aquí se haría una llamada a un backend
    // que realiza el web scraping. Por ahora retornamos datos simulados.

    // Placeholder - simular datos importados
    const mockData: ImportedProperty = {
        source,
        externalId: `ext_${Date.now()}`,
        url,
        rawData: {},
        property: {
            title: 'Propiedad importada',
            description: 'Descripción de la propiedad importada desde ' + source,
            type: PropertyType.CASA,
            operation: OperationType.VENTA,
            status: PropertyStatus.DISPONIBLE
        },
        imported: false
    };

    return mockData;
}

/**
 * Convierte datos scrapeados a formato Property
 */
export function convertToProperty(
    scraped: ScrapedData,
    agentId: string,
    agencyId: string
): Partial<Property> {
    const location = parseLocation(scraped.location);

    return {
        id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: scraped.title,
        description: scraped.description,
        type: mapPropertyType(scraped.type),
        operation: mapOperationType(scraped.operation),
        address: {
            street: '',
            exteriorNumber: '',
            colony: location.colony,
            city: location.city,
            state: location.state,
            zipCode: ''
        },
        specs: {
            m2Total: scraped.m2,
            m2Built: scraped.m2,
            bedrooms: scraped.bedrooms,
            bathrooms: scraped.bathrooms,
            parking: scraped.parking,
            floors: 1
        },
        amenities: [],
        salePrice: scraped.operation.toLowerCase().includes('venta') ? scraped.price : undefined,
        rentPrice: scraped.operation.toLowerCase().includes('renta') ? scraped.price : undefined,
        status: PropertyStatus.DISPONIBLE,
        agentId,
        agencyId,
        images: scraped.images,
        dateAdded: new Date().toISOString(),
        views: 0,
        favorites: 0
    };
}

// ============ BÚSQUEDA EN PORTALES ============

/**
 * Busca propiedades en portales externos (requiere backend)
 */
export async function searchInPortals(
    query: string,
    filters: {
        type?: PropertyType;
        operation?: OperationType;
        minPrice?: number;
        maxPrice?: number;
        city?: string;
    }
): Promise<ImportedProperty[]> {
    console.log('Searching portals:', query, filters);

    // NOTA: En producción, esto llamaría a un backend que busca en los portales
    // Por ahora retornamos array vacío

    return [];
}

/**
 * Obtiene propiedades destacadas de un portal
 */
export async function getFeaturedFromPortal(portalId: string): Promise<ImportedProperty[]> {
    console.log('Getting featured from:', portalId);
    return [];
}

// ============ UTILIDADES ============

/**
 * Valida si una URL es de un portal soportado
 */
export function isValidPortalUrl(url: string): boolean {
    return SUPPORTED_PORTALS.some(portal =>
        url.includes(portal.url.replace('https://', '').replace('www.', ''))
    );
}

/**
 * Obtiene información del portal desde URL
 */
export function getPortalFromUrl(url: string): typeof SUPPORTED_PORTALS[0] | null {
    for (const portal of SUPPORTED_PORTALS) {
        if (url.includes(portal.url.replace('https://', '').replace('www.', ''))) {
            return portal;
        }
    }
    return null;
}

/**
 * Marca propiedad como importada
 */
export function markAsImported(imported: ImportedProperty): ImportedProperty {
    return {
        ...imported,
        imported: true
    };
}
