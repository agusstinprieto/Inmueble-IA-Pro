import React, { useState, useEffect } from 'react';
import { supabase, getUserProfile, getAgencyProfile, signOut } from '../services/supabase';
import { Profile, Agency, UserRole } from '../types';

export interface UseAuthReturn {
    isAuthenticated: boolean;
    isLoading: boolean;
    userId: string | null;
    profile: Profile | null;
    agency: Agency | null;
    userRole: UserRole;
    businessName: string;
    brandColor: string;
    location: string;
    logoUrl: string;
    scriptUrl: string;
    setProfile: (profile: Profile | null) => void;
    setAgency: React.Dispatch<React.SetStateAction<Agency | null>>;
    setBusinessName: (name: string) => void;
    setBrandColor: (color: string) => void;
    setLocation: (location: string) => void;
    setLogoUrl: (url: string) => void;
    setScriptUrl: (url: string) => void;
    handleLogout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [businessName, setBusinessName] = useState(() => localStorage.getItem('inmueble_businessName') || 'INMUEBLE IA PRO');
    const [brandColor, setBrandColor] = useState(() => localStorage.getItem('inmueble_brandColor') || '#f59e0b');
    const [userRole, setUserRole] = useState<UserRole>('agent');
    const [location, setLocation] = useState(() => localStorage.getItem('inmueble_location') || '');
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('inmueble_logoUrl') || '');
    const [scriptUrl, setScriptUrl] = useState('');
    const [showBypass, setShowBypass] = useState(false);

    useEffect(() => {
        checkSession();

        // Fallback: Si por alguna razón la sesión tarda demasiado, habilitamos el botón de entrada manual
        const bypassTimer = setTimeout(() => setShowBypass(true), 4000);

        // Hard fallback: Después de 7 segundos, forzamos la entrada
        const hardExitTimer = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    console.warn('⚠️ Salida forzada de pantalla de carga (Hard Exit)');
                    return false;
                }
                return prev;
            });
        }, 7000);

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setUserId(session.user.id);
                setIsAuthenticated(true);
            } else if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                setUserId(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(bypassTimer);
            clearTimeout(hardExitTimer);
        };
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUserId(session.user.id);
                setIsAuthenticated(true);

                // Load Profile and Agency
                const userProfile = await getUserProfile(session.user.id);
                if (userProfile) {
                    setProfile(userProfile);
                    setUserRole(userProfile.role);

                    if (userProfile.agencyId) {
                        const agencyData = await getAgencyProfile(userProfile.agencyId);
                        if (agencyData) {
                            setAgency(agencyData);
                            setBusinessName(agencyData.name);
                            setBrandColor(agencyData.brandColor);
                            setScriptUrl(agencyData.googleSheetsUrl || '');
                            setLocation(agencyData.location || '');
                            setLogoUrl(agencyData.logoUrl || '');

                            // Persist for instant load next time
                            localStorage.setItem('inmueble_businessName', agencyData.name);
                            localStorage.setItem('inmueble_brandColor', agencyData.brandColor);
                            if (agencyData.location) {
                                localStorage.setItem('inmueble_location', agencyData.location);
                            }
                            if (agencyData.logoUrl) {
                                localStorage.setItem('inmueble_logoUrl', agencyData.logoUrl);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            setIsAuthenticated(false);
            setUserId(null);
            setProfile(null);
            setAgency(null);
            localStorage.removeItem('inmueble_businessName');
            localStorage.removeItem('inmueble_brandColor');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return {
        isAuthenticated,
        isLoading,
        userId,
        profile,
        agency,
        userRole,
        businessName,
        brandColor,
        location,
        logoUrl,
        scriptUrl,
        setProfile,
        setAgency,
        setBusinessName,
        setBrandColor,
        setLocation,
        setLogoUrl,
        setScriptUrl,
        handleLogout
    };
}
