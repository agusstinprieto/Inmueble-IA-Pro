/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Property, Client, Contract, Sale, FollowUp, Agent, Profile, Agency, UserRole } from '../types';
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
// Simplified versions for the service layer if needed, 
// but we'll use the ones from types.ts mainly.

// ============ AUTH ============

export const signInWithBusinessId = async (businessId: string, password: string) => {
    // Note: In SaaS, businessId might be simpler or we use direct email. 
    // Staying compatible with the current "demo" email logic for now.
    const email = businessId.includes('@') ? businessId : `${businessId.toLowerCase()}@inmuebleiapro.local`;

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

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    // Map DB to Type
    return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        agencyId: data.agency_id,
        branchId: data.branch_id,
        photoUrl: data.photo_url,
        phone: data.phone,
        commission: data.commission,
        active: data.active
    };
};

export const getAgencyProfile = async (agencyId: string): Promise<Agency | null> => {
    const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .single();

    if (error) {
        console.error('Error fetching agency:', error);
        return null;
    }

    return {
        id: data.id,
        ownerId: data.owner_id,
        name: data.name,
        logoUrl: data.logo_url,
        brandColor: data.brand_color,
        planType: data.plan_type as any,
        status: data.status as any,
        googleSheetsUrl: data.google_sheets_url,
        dateCreated: data.created_at
    };
};

export const updateUserProfile = async (userId: string, profile: Partial<Profile>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                name: profile.name,
                photo_url: profile.photoUrl,
                role: profile.role,
                agency_id: profile.agencyId,
                branch_id: profile.branchId,
                phone: profile.phone,
                commission: profile.commission,
                active: profile.active
            })
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        return false;
    }
};

export const updateAgencyProfile = async (agencyId: string, agency: Partial<Agency>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('agencies')
            .update({
                name: agency.name,
                logo_url: agency.logoUrl,
                brand_color: agency.brandColor,
                plan_type: agency.planType,
                status: agency.status,
                google_sheets_url: agency.googleSheetsUrl
            })
            .eq('id', agencyId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating agency:', error);
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

export const getProperties = async (agencyId?: string): Promise<Property[]> => {
    let query = supabase.from('properties').select('*');

    if (agencyId) {
        query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching properties:', error);
        return [];
    }

    return data?.map(mapDbToProperty) || [];
};

export const addProperty = async (property: Partial<Property>, agencyId?: string, branchId?: string, agencySheetsUrl?: string): Promise<Property | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    let finalAgencyId = agencyId || property.agencyId;

    // Fallback: Fetch from profile if missing
    if (!finalAgencyId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('agency_id')
            .eq('id', session.user.id)
            .single();

        if (profile) finalAgencyId = profile.agency_id;
    }

    if (!finalAgencyId) {
        console.error('❌ Error: No agency_id found for this user. Cannot create property.');
        return null; // RLS will fail anyway
    }

    const { data, error } = await supabase
        .from('properties')
        .insert({
            ...mapPropertyToDb(property, session.user.id),
            agency_id: finalAgencyId,
            branch_id: branchId
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding property:', error);
        return null;
    }

    const mappedProperty = mapDbToProperty(data);
    await appendPropertyToSheets(mappedProperty, agencySheetsUrl);
    return mappedProperty;
};

export const updateProperty = async (property: Property, agencySheetsUrl?: string): Promise<Property | null> => {
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
    await appendPropertyToSheets(updatedProperty, agencySheetsUrl);
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

export const getAgents = async (agencyId?: string): Promise<Agent[]> => {
    let query = supabase.from('profiles').select('*').in('role', ['agent', 'branch_manager', 'agency_owner']);

    if (agencyId) {
        query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
        console.error('Error fetching agents:', error);
        return [];
    }

    return data?.map(mapDbToAgent) || [];
};

export const addAgent = async (agent: Partial<Agent>, agencyId?: string): Promise<Agent | null> => {
    // In SaaS, adding an agent usually means creating an auth user or inviting them.
    // For now, we'll just insert into profiles if we have the ID, 
    // but typically this should be an invite flow.
    // Hack: staying compatible with the UI for now.
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            ...mapAgentToDb(agent),
            agency_id: agencyId || agent.agencyId,
            role: 'agent'
        })
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
        .from('profiles')
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
        .from('profiles')
        .update({ agency_id: null, active: false }) // Soft delete/unassign in SaaS
        .eq('id', id);

    if (error) {
        console.error('Error deleting agent:', error);
        return false;
    }

    return true;
};

// ============ CLIENTS CRUD ============

export const getClients = async (agencyId?: string): Promise<Client[]> => {
    let query = supabase.from('clients').select(`
        *,
        follow_ups(*)
    `);

    if (agencyId) {
        query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data?.map(mapDbToClient) || [];
};

export const addClient = async (client: Partial<Client>, agencyId?: string, agencySheetsUrl?: string): Promise<Client | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('clients')
        .insert({
            ...mapClientToDb(client),
            agency_id: agencyId || client.agencyId
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding client:', error);
        return null;
    }

    const mappedClient = mapDbToClient(data);
    await appendClientToSheets(mappedClient, agencySheetsUrl);
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

// ============ SALES CRUD ============

export const getSales = async (agencyId?: string): Promise<Sale[]> => {
    let query = supabase.from('sales').select('*');

    if (agencyId) {
        query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sales:', error);
        return [];
    }

    return data?.map(mapDbToSale) || [];
};

export const addSale = async (sale: Partial<Sale>, agencyId?: string): Promise<Sale | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('sales')
        .insert({
            ...mapSaleToDb(sale),
            agency_id: agencyId
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding sale:', error);
        return null;
    }

    return mapDbToSale(data);
};

// ============ CONTRACTS CRUD ============

export const getContracts = async (agencyId?: string): Promise<Contract[]> => {
    let query = supabase.from('contracts').select('*');

    if (agencyId) {
        query = query.eq('agency_id', agencyId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contracts:', error);
        return [];
    }

    return data?.map(mapDbToContract) || [];
};

export const addContract = async (contract: Partial<Contract>, agencyId?: string): Promise<Contract | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('contracts')
        .insert({
            ...mapContractToDb(contract),
            agency_id: agencyId || contract.agentId // Fallback to agentId if agencyId not provided
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding contract:', error);
        return null;
    }

    return mapDbToContract(data);
};

export const deleteContract = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting contract:', error);
        return false;
    }

    return true;
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
        agencyId: db.agency_id,
        branchId: db.branch_id,
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

function mapClientToDb(client: Partial<Client>): any {
    return {
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
        agent_id: client.agentId,
        agency_id: client.agencyId,
        branch_id: client.branchId
    };
}

function mapDbToAgent(db: any): Agent {
    return {
        id: db.id,
        name: db.name || (db.email ? db.email.split('@')[0] : 'Sin Nombre'),
        phone: db.phone || '',
        email: db.email,
        photo: db.photo_url || '',
        agencyId: db.agency_id,
        properties: [], // Not present in profiles table
        clients: [], // Not present in profiles table
        sales: [], // Not present in profiles table
        commission: db.commission || 0,
        dateJoined: db.created_at,
        active: db.active !== false
    };
}

function mapAgentToDb(agent: Partial<Agent>): any {
    return {
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        photo_url: agent.photo,
        agency_id: agent.agencyId,
        commission: agent.commission,
        active: agent.active
    };
}

function mapDbToSale(db: any): Sale {
    return {
        id: db.id,
        propertyId: db.property_id,
        clientId: db.client_id,
        agentId: db.agent_id,
        type: db.type,
        finalPrice: parseFloat(db.final_price) || 0,
        commission: parseFloat(db.commission) || 0,
        agencyId: db.agency_id,
        branchId: db.branch_id,
        dateClosed: db.created_at,
        contractId: db.contract_id
    };
}

function mapSaleToDb(sale: Partial<Sale>): any {
    return {
        property_id: sale.propertyId,
        client_id: sale.clientId,
        agent_id: sale.agentId,
        type: sale.type,
        final_price: sale.finalPrice,
        commission: sale.commission,
        contract_id: sale.contractId,
        agency_id: sale.agencyId,
        branch_id: sale.branchId
    };
}

function mapDbToContract(db: any): Contract {
    return {
        id: db.id,
        type: db.type as any,
        propertyId: db.property_id,
        agentId: db.agent_id,
        clientId: db.client_id,
        dateCreated: db.created_at, // Fixed
        startDate: db.start_date,
        endDate: db.end_date,
        amount: db.amount,
        deposit: db.deposit,
        terms: db.terms,
        signed: db.signed,
        agencyId: db.agency_id,
        branchId: db.branch_id
    };
}

function mapContractToDb(contract: Partial<Contract>): any {
    return {
        type: contract.type,
        property_id: contract.propertyId,
        agent_id: contract.agentId,
        client_id: contract.clientId,
        // created_at: contract.dateCreated, // Let DB handle defaults
        start_date: contract.startDate,
        end_date: contract.endDate,
        amount: contract.amount,
        deposit: contract.deposit,
        terms: contract.terms,
        signed: contract.signed,
        agency_id: contract.agencyId,
        branch_id: contract.branchId
    };
}
