
// ============================================
// INMUEBLE IA PRO - Servicio de WhatsApp
// ============================================

import { Client, FollowUp, Property } from '../types';

// ============ CONFIGURACIÓN ============

const WHATSAPP_API_URL = 'https://api.whatsapp.com/send';

// ============ PLANTILLAS DE MENSAJES ============

export const messageTemplates = {
    es: {
        greeting: (clientName: string, agentName: string) =>
            `¡Hola ${clientName}! 👋 Soy ${agentName}, tu asesor inmobiliario. ¿Cómo puedo ayudarte hoy?`,

        newProperty: (clientName: string, property: Partial<Property>) =>
            `¡Hola ${clientName}! 🏠 Tengo una propiedad que podría interesarte:

📍 *${property.title}*
💰 $${property.salePrice?.toLocaleString() || property.rentPrice?.toLocaleString()}
🛏️ ${property.specs?.bedrooms} recámaras | 🚿 ${property.specs?.bathrooms} baños
📐 ${property.specs?.m2Built} m²

¿Te gustaría agendar una visita?`,

        followUp: (clientName: string) =>
            `¡Hola ${clientName}! 👋 Solo quería dar seguimiento a nuestra conversación. ¿Tienes alguna pregunta sobre las propiedades que vimos?`,

        visitReminder: (clientName: string, property: Partial<Property>, date: string) =>
            `¡Hola ${clientName}! 📅 Te recuerdo tu cita para visitar:

🏠 ${property.title}
📍 ${property.address?.colony}, ${property.address?.city}
🕐 ${date}

¡Te esperamos!`,

        thankYou: (clientName: string) =>
            `¡Gracias ${clientName}! 🙏 Fue un placer atenderte. Si tienes alguna duda, no dudes en contactarme.`,

        priceUpdate: (clientName: string, property: Partial<Property>, newPrice: number) =>
            `¡Hola ${clientName}! 📢 Buenas noticias:

La propiedad que te interesaba ahora tiene un nuevo precio:
🏠 ${property.title}
💰 Antes: $${property.salePrice?.toLocaleString()}
✨ Ahora: $${newPrice.toLocaleString()}

¿Quieres saber más?`
    },
    en: {
        greeting: (clientName: string, agentName: string) =>
            `Hello ${clientName}! 👋 I'm ${agentName}, your real estate advisor. How can I help you today?`,

        newProperty: (clientName: string, property: Partial<Property>) =>
            `Hello ${clientName}! 🏠 I have a property you might like:

📍 *${property.title}*
💰 $${property.salePrice?.toLocaleString() || property.rentPrice?.toLocaleString()}
🛏️ ${property.specs?.bedrooms} beds | 🚿 ${property.specs?.bathrooms} baths
📐 ${property.specs?.m2Built} sqft

Would you like to schedule a visit?`,

        followUp: (clientName: string) =>
            `Hello ${clientName}! 👋 Just following up on our conversation. Do you have any questions about the properties we saw?`,

        visitReminder: (clientName: string, property: Partial<Property>, date: string) =>
            `Hello ${clientName}! 📅 Reminder for your visit:

🏠 ${property.title}
📍 ${property.address?.colony}, ${property.address?.city}
🕐 ${date}

See you there!`,

        thankYou: (clientName: string) =>
            `Thank you ${clientName}! 🙏 It was a pleasure helping you. If you have any questions, don't hesitate to reach out.`,

        priceUpdate: (clientName: string, property: Partial<Property>, newPrice: number) =>
            `Hello ${clientName}! 📢 Great news:

The property you liked now has a new price:
🏠 ${property.title}
💰 Before: $${property.salePrice?.toLocaleString()}
✨ Now: $${newPrice.toLocaleString()}

Want to know more?`
    }
};

// ============ FUNCIONES ============

/**
 * Genera un enlace de WhatsApp Web para enviar mensaje
 */
export function generateWhatsAppLink(phone: string, message: string): string {
    // Limpiar número de teléfono
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    return `${WHATSAPP_API_URL}?phone=${cleanPhone}&text=${encodedMessage}`;
}

/**
 * Abre WhatsApp con mensaje predefinido
 */
export function openWhatsApp(phone: string, message: string): void {
    const link = generateWhatsAppLink(phone, message);
    window.open(link, '_blank');
}

/**
 * Envía mensaje de saludo a cliente
 */
export function sendGreeting(
    client: Client,
    agentName: string,
    lang: 'es' | 'en' = 'es'
): void {
    const message = messageTemplates[lang].greeting(client.name, agentName);
    openWhatsApp(client.phone, message);
}

/**
 * Envía información de nueva propiedad
 */
export function sendPropertyInfo(
    client: Client,
    property: Property,
    lang: 'es' | 'en' = 'es'
): void {
    const message = messageTemplates[lang].newProperty(client.name, property);
    openWhatsApp(client.phone, message);
}

/**
 * Envía mensaje de seguimiento
 */
export function sendFollowUp(
    client: Client,
    lang: 'es' | 'en' = 'es'
): void {
    const message = messageTemplates[lang].followUp(client.name);
    openWhatsApp(client.phone, message);
}

/**
 * Envía recordatorio de visita
 */
export function sendVisitReminder(
    client: Client,
    property: Property,
    date: string,
    lang: 'es' | 'en' = 'es'
): void {
    const message = messageTemplates[lang].visitReminder(client.name, property, date);
    openWhatsApp(client.phone, message);
}

/**
 * Envía mensaje de agradecimiento
 */
export function sendThankYou(
    client: Client,
    lang: 'es' | 'en' = 'es'
): void {
    const message = messageTemplates[lang].thankYou(client.name);
    openWhatsApp(client.phone, message);
}

/**
 * Notifica actualización de precio
 */
export function sendPriceUpdate(
    client: Client,
    property: Property,
    newPrice: number,
    lang: 'es' | 'en' = 'es'
): void {
    const message = messageTemplates[lang].priceUpdate(client.name, property, newPrice);
    openWhatsApp(client.phone, message);
}

/**
 * Genera mensaje personalizado con IA (usando gemini)
 */
export function generateCustomMessage(
    client: Client,
    context: string,
    property?: Property
): string {
    // Placeholder - se integra con gemini.ts para generar mensajes personalizados
    return `Hola ${client.name}, ${context}`;
}

/**
 * Registra seguimiento en el cliente
 */
export function logFollowUp(
    client: Client,
    type: FollowUp['type'],
    notes: string
): FollowUp {
    const followUp: FollowUp = {
        id: `followup_${Date.now()}`,
        date: new Date().toISOString(),
        type,
        notes,
        completed: true
    };

    return followUp;
}

/**
 * Programa seguimiento futuro
 */
export function scheduleFollowUp(
    client: Client,
    date: string,
    type: FollowUp['type'],
    notes: string
): FollowUp {
    const followUp: FollowUp = {
        id: `followup_${Date.now()}`,
        date,
        type,
        notes,
        completed: false
    };

    return followUp;
}
