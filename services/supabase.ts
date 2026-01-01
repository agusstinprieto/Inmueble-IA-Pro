/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Property, Client, Contract, Sale, FollowUp, Agent } from '../types';
import { appendPropertyToSheets, appendClientToSheets } from './sheets';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Check your .env.local file.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

// ============ TYPES ============

export interface BusinessProfile {
    id: string;
    business_id: string;
    business_name: string;
    location: string;
    script_url: string;
    branding_color: string;
    role: 'admin' | 'employee';
}

// ============ AUTH ============

export const signInWithBusinessId = async (businessId: string, password: string) => {
    const email = `${businessId.toLowerCase()}@inmuebleiapro.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

export const getBusinessProfile = async (userId: string): Promise<BusinessProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
};

export const updateBusinessProfile = async (userId: string, profile: Partial<BusinessProfile>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                business_name: profile.business_name,
                location: profile.location,
                branding_color: profile.branding_color,
                script_url: profile.script_url,
                role: profile.role
            })
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        return false;
    }
};

// ============ IMAGE STORAGE ============

export const uploadPropertyImage = async (
    file: Blob,
    propertyId: string,
    index: number
): Promise<string | null> => {
    try {
        const fileName = `${propertyId}/${Date.now()}-${index}.jpg`;

        const { data, error } = await supabase.storage
            .from('property-images')
            .upload(fileName, file, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error('Error uploading image:', error);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Upload image error:', error);
        return null;
    }
};

export const uploadPropertyImages = async (
    images: string[],
    propertyId: string
): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];

        // Skip if already a public URL (http/https)
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            uploadedUrls.push(imageUrl);
            continue;
        }

        // Convert blob URL to Blob
        if (imageUrl.startsWith('blob:')) {
            try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const publicUrl = await uploadPropertyImage(blob, propertyId, i);

                if (publicUrl) {
                    uploadedUrls.push(publicUrl);
                } else {
                    console.warn(`Failed to upload image ${i}`);
                }
            } catch (error) {
                console.error(`Error processing blob ${i}:`, error);
            }
        }
    }

    return uploadedUrls;
};

// ============ PROPERTIES CRUD ============

export const getProperties = async (): Promise<Property[]> => {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching properties:', error);
        return [];
    }

    return data?.map(mapDbToProperty) || [];
};

export const addProperty = async (property: Partial<Property>): Promise<Property | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('properties')
        .insert(mapPropertyToDb(property, session.user.id))
        .select()
        .single();

    if (error) {
        console.error('Error adding property:', error);
        return null;
    }

    const mappedProperty = mapDbToProperty(data);
    await appendPropertyToSheets(mappedProperty);
    return mappedProperty;
};

export const updateProperty = async (property: Property): Promise<Property | null> => {
    const { data, error } = await supabase
        .from('properties')
        .update(mapPropertyToDb(property))
        .eq('id', property.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating property:', error);
        return null;
    }

    const updatedProperty = mapDbToProperty(data);
    await appendPropertyToSheets(updatedProperty);
    return updatedProperty;
};


export const deleteProperty = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting property:', error);
        return false;
    }

    return true;
};

// ============ AGENTS CRUD ============

export const getAgents = async (): Promise<Agent[]> => {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching agents:', error);
        return [];
    }

    return data?.map(mapDbToAgent) || [];
};

export const addAgent = async (agent: Partial<Agent>): Promise<Agent | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('agents')
        .insert(mapAgentToDb(agent, session.user.id))
        .select()
        .single();

    if (error) {
        console.error('Error adding agent:', error);
        return null;
    }

    return mapDbToAgent(data);
};

export const updateAgent = async (agent: Agent): Promise<Agent | null> => {
    const { data, error } = await supabase
        .from('agents')
        .update(mapAgentToDb(agent))
        .eq('id', agent.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating agent:', error);
        return null;
    }

    return mapDbToAgent(data);
};

export const deleteAgent = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting agent:', error);
        return false;
    }

    return true;
};

// ============ CLIENTS CRUD ============

export const getClients = async (): Promise<Client[]> => {
    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
    follow_ups(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data?.map(mapDbToClient) || [];
};

export const addClient = async (client: Partial<Client>): Promise<Client | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('clients')
        .insert(mapClientToDb(client, session.user.id))
        .select()
        .single();

    if (error) {
        console.error('Error adding client:', error);
        return null;
    }

    const mappedClient = mapDbToClient(data);
    await appendClientToSheets(mappedClient);
    return mappedClient;
};

export const updateClient = async (client: Client): Promise<Client | null> => {
    const { data, error } = await supabase
        .from('clients')
        .update(mapClientToDb(client))
        .eq('id', client.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating client:', error);
        return null;
    }

    return mapDbToClient(data);
};

export const deleteClient = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting client:', error);
        return false;
    }

    return true;
};

// ============ FOLLOW-UPS ============

export const addFollowUp = async (clientId: string, followUp: Partial<FollowUp>): Promise<FollowUp | null> => {
    const { data, error } = await supabase
        .from('follow_ups')
        .insert({
            client_id: clientId,
            type: followUp.type,
            notes: followUp.notes,
            scheduled_date: followUp.scheduledDate,
            completed: followUp.completed || false
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding follow-up:', error);
        return null;
    }

    return {
        id: data.id,
        date: data.created_at,
        type: data.type,
        notes: data.notes,
        scheduledDate: data.scheduled_date,
        completed: data.completed
    };
};



export const deletePropertyImage = async (url: string): Promise<boolean> => {
    try {
        const path = url.split('/property-images/')[1];
        if (!path) return false;

        const { error } = await supabase.storage
            .from('property-images')
            .remove([path]);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Delete error:', err);
        return false;
    }
};

// ============ MAPPERS ============

function mapDbToProperty(db: any): Property {
    return {
        id: db.id,
        title: db.title,
        type: db.type,
        operation: db.operation,
        status: db.status,
        description: db.description,
        address: {
            street: db.street || '',
            exteriorNumber: db.exterior_number || '',
            interiorNumber: db.interior_number || '',
            colony: db.colony || '',
            city: db.city || '',
            state: db.state || '',
            zipCode: db.zip_code || '',
            country: db.country || 'MEXICO'
        },
        currency: db.currency || 'MXN',
        coordinates: db.latitude && db.longitude ? {
            lat: parseFloat(db.latitude),
            lng: parseFloat(db.longitude)
        } : undefined,
        specs: {
            m2Total: db.m2_total || 0,
            m2Built: db.m2_built || 0,
            bedrooms: db.bedrooms || 0,
            bathrooms: db.bathrooms || 0,
            parking: db.parking || 0,
            floors: db.floors || 1
        },
        amenities: db.amenities || [],
        images: (db.images || []).filter((url: string) => !url.startsWith('blob:')),
        salePrice: parseFloat(db.sale_price) || 0,
        rentPrice: parseFloat(db.rent_price) || 0,
        views: db.views || 0,
        favorites: db.favorites || 0,
        agentId: db.agent_id,
        agencyId: db.agency_id,
        virtualTourUrl: db.virtual_tour_url,
        dateAdded: db.created_at
    };
}

function mapPropertyToDb(property: Partial<Property>, userId?: string): any {
    return {
        ...(userId && { user_id: userId }),
        title: property.title,
        type: property.type,
        operation: property.operation,
        status: property.status,
        description: property.description,
        street: property.address?.street,
        exterior_number: property.address?.exteriorNumber,
        interior_number: property.address?.interiorNumber,
        colony: property.address?.colony,
        city: property.address?.city,
        state: property.address?.state,
        zip_code: property.address?.zipCode,
        country: property.address?.country,
        currency: property.currency,
        latitude: property.coordinates?.lat,
        longitude: property.coordinates?.lng,
        m2_total: property.specs?.m2Total,
        m2_built: property.specs?.m2Built,
        bedrooms: property.specs?.bedrooms,
        bathrooms: property.specs?.bathrooms,
        parking: property.specs?.parking,
        floors: property.specs?.floors,
        amenities: property.amenities,
        images: property.images,
        sale_price: property.salePrice,
        rent_price: property.rentPrice,
        views: property.views,
        favorites: property.favorites,
        agent_id: property.agentId,
        agency_id: property.agencyId,
        virtual_tour_url: property.virtualTourUrl
    };
}

function mapDbToClient(db: any): Client {
    return {
        id: db.id,
        name: db.name,
        phone: db.phone,
        email: db.email,
        interest: db.interest,
        preferredTypes: db.preferred_types || [],
        budgetMin: parseFloat(db.budget_min) || 0,
        budgetMax: parseFloat(db.budget_max) || 0,
        preferredZones: db.preferred_zones || [],
        notes: db.notes,
        status: db.status,
        source: db.source,
        agentId: db.agent_id,
        followUps: (db.follow_ups || []).map((fu: any) => ({
            id: fu.id,
            date: fu.created_at,
            type: fu.type,
            notes: fu.notes,
            scheduledDate: fu.scheduled_date,
            completed: fu.completed
        })),
        viewedProperties: [],
        dateAdded: db.created_at
    };
}

function mapClientToDb(client: Partial<Client>, userId?: string): any {
    return {
        ...(userId && { user_id: userId }),
        name: client.name,
        phone: client.phone,
        email: client.email,
        interest: client.interest,
        preferred_types: client.preferredTypes,
        budget_min: client.budgetMin,
        budget_max: client.budgetMax,
        preferred_zones: client.preferredZones,
        notes: client.notes,
        status: client.status,
        source: client.source,
        agent_id: client.agentId
    };
}

function mapDbToAgent(db: any): Agent {
    return {
        id: db.id,
        name: db.name,
        phone: db.phone,
        email: db.email,
        photo: db.photo,
        agencyId: db.agency_id,
        properties: db.properties || [],
        clients: db.clients || [],
        sales: db.sales || [],
        commission: db.commission || 0,
        dateJoined: db.created_at,
        active: db.active !== false
    };
}

function mapAgentToDb(agent: Partial<Agent>, userId?: string): any {
    return {
        ...(userId && { user_id: userId }),
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        photo: agent.photo,
        agency_id: agent.agencyId,
        properties: agent.properties,
        clients: agent.clients,
        sales: agent.sales,
        commission: agent.commission,
        active: agent.active
    };
}
