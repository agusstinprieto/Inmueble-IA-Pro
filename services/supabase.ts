/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Check your .env.local file.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

// Types for the profiles table
export interface BusinessProfile {
    id: string;
    business_id: string;
    business_name: string;
    location: string;
    script_url: string;
    branding_color: string;
}

// Auth helper functions
export const signInWithBusinessId = async (businessId: string, password: string) => {
    // We use businessId as email format for Supabase Auth
    const email = `${businessId.toLowerCase()}@autopartenon.local`;

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
