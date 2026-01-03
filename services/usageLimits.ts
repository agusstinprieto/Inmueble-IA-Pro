import { supabase } from './supabase';

// Tier limits configuration
export const TIER_LIMITS = {
    individual: {
        propertyAnalysis: 50,
        adGeneration: 100,
        voiceQueries: 20,
        contracts: 10
    },
    small_agency: {
        propertyAnalysis: 200,
        adGeneration: 400,
        voiceQueries: 80,
        contracts: 40
    },
    corporate: {
        propertyAnalysis: 1000,
        adGeneration: 2000,
        voiceQueries: 400,
        contracts: 200
    },
    enterprise: {
        propertyAnalysis: -1, // unlimited
        adGeneration: -1,
        voiceQueries: -1,
        contracts: -1
    }
} as const;

export type TierName = keyof typeof TIER_LIMITS;
export type FeatureType = 'propertyAnalysis' | 'adGeneration' | 'voiceQueries' | 'contracts';

export interface UsageCheckResult {
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
    tierName: string;
}

export interface UsageStats {
    tierName: string;
    tierDisplayName: string;
    features: {
        propertyAnalysis: { current: number; limit: number; percentage: number };
        adGeneration: { current: number; limit: number; percentage: number };
        voiceQueries: { current: number; limit: number; percentage: number };
        contracts: { current: number; limit: number; percentage: number };
    };
}

/**
 * Check if user can perform an action based on their tier limits
 */
export async function checkUsageLimit(
    agencyId: string,
    featureType: FeatureType
): Promise<UsageCheckResult> {
    try {
        // Get agency's subscription tier
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('subscription_tier')
            .eq('id', agencyId)
            .single();

        if (agencyError) throw agencyError;

        const tierName = (agency?.subscription_tier || 'individual') as TierName;
        const limits = TIER_LIMITS[tierName];
        const limit = limits[featureType];

        // Unlimited tier (-1)
        if (limit === -1) {
            return {
                allowed: true,
                current: 0,
                limit: -1,
                percentage: 0,
                tierName
            };
        }

        // Get current usage for this month
        const { data: currentUsage, error: usageError } = await supabase
            .rpc('get_current_usage', {
                p_agency_id: agencyId,
                p_feature_type: featureType
            });

        if (usageError) throw usageError;

        const current = currentUsage || 0;
        const allowed = current < limit;
        const percentage = Math.round((current / limit) * 100);

        return {
            allowed,
            current,
            limit,
            percentage,
            tierName
        };
    } catch (error) {
        console.error('Error checking usage limit:', error);
        // Fail open - allow the action but log the error
        return {
            allowed: true,
            current: 0,
            limit: 0,
            percentage: 0,
            tierName: 'individual'
        };
    }
}

/**
 * Increment usage counter for a feature
 */
export async function incrementUsage(
    agencyId: string,
    userId: string,
    featureType: FeatureType
): Promise<void> {
    try {
        const { error } = await supabase.rpc('increment_usage', {
            p_agency_id: agencyId,
            p_user_id: userId,
            p_feature_type: featureType
        });

        if (error) throw error;
    } catch (error) {
        console.error('Error incrementing usage:', error);
        // Don't throw - we don't want to block the user action if tracking fails
    }
}

/**
 * Get comprehensive usage statistics for an agency
 */
export async function getUsageStats(agencyId: string): Promise<UsageStats> {
    try {
        // Get agency tier
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('subscription_tier')
            .eq('id', agencyId)
            .single();

        if (agencyError) throw agencyError;

        const tierName = (agency?.subscription_tier || 'individual') as TierName;
        const limits = TIER_LIMITS[tierName];

        // Get tier display name
        const { data: tierData } = await supabase
            .from('subscription_tiers')
            .select('display_name')
            .eq('name', tierName)
            .single();

        const tierDisplayName = tierData?.display_name || 'Agente Individual';

        // Get usage for all features
        const features = {
            propertyAnalysis: { current: 0, limit: limits.propertyAnalysis, percentage: 0 },
            adGeneration: { current: 0, limit: limits.adGeneration, percentage: 0 },
            voiceQueries: { current: 0, limit: limits.voiceQueries, percentage: 0 },
            contracts: { current: 0, limit: limits.contracts, percentage: 0 }
        };

        for (const feature of Object.keys(features) as FeatureType[]) {
            const { data: usage } = await supabase.rpc('get_current_usage', {
                p_agency_id: agencyId,
                p_feature_type: feature
            });

            const current = usage || 0;
            const limit: number = limits[feature];
            const percentage = limit === -1 ? 0 : Math.round((current / limit) * 100);

            features[feature] = { current, limit, percentage };
        }

        return {
            tierName,
            tierDisplayName,
            features
        };
    } catch (error) {
        console.error('Error getting usage stats:', error);
        throw error;
    }
}

/**
 * Check if usage is approaching limit (80%+)
 */
export function isApproachingLimit(percentage: number): boolean {
    return percentage >= 80 && percentage < 100;
}

/**
 * Check if limit is reached (100%+)
 */
export function isLimitReached(percentage: number): boolean {
    return percentage >= 100;
}

/**
 * Get user-friendly error message for limit reached
 */
export function getLimitReachedMessage(
    featureType: FeatureType,
    current: number,
    limit: number,
    lang: 'es' | 'en' = 'es'
): string {
    const featureNames = {
        es: {
            propertyAnalysis: 'análisis de propiedades',
            adGeneration: 'generación de anuncios',
            voiceQueries: 'consultas de voz',
            contracts: 'generación de contratos'
        },
        en: {
            propertyAnalysis: 'property analyses',
            adGeneration: 'ad generation',
            voiceQueries: 'voice queries',
            contracts: 'contract generation'
        }
    };

    const featureName = featureNames[lang][featureType];

    if (lang === 'es') {
        return `Has alcanzado el límite mensual de ${featureName} (${current}/${limit}). Actualiza tu plan para continuar.`;
    } else {
        return `You've reached the monthly limit for ${featureName} (${current}/${limit}). Upgrade your plan to continue.`;
    }
}
