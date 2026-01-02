import { Property, PropertyType, OperationType } from '../types';

/**
 * Find similar properties based on multiple criteria
 * @param currentProperty - The property to find similarities for
 * @param allProperties - All available properties
 * @param maxResults - Maximum number of similar properties to return (default: 4)
 * @returns Array of similar properties, sorted by relevance
 */
export const findSimilarProperties = (
    currentProperty: Property,
    allProperties: Property[],
    maxResults: number = 4
): Property[] => {
    // Filter out the current property and calculate similarity scores
    const scoredProperties = allProperties
        .filter(p => p.id !== currentProperty.id)
        .map(property => ({
            property,
            score: calculateSimilarityScore(currentProperty, property)
        }))
        .filter(item => item.score > 0) // Only include properties with some similarity
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, maxResults); // Take top N results

    return scoredProperties.map(item => item.property);
};

/**
 * Calculate similarity score between two properties
 * Higher score = more similar
 */
function calculateSimilarityScore(base: Property, compare: Property): number {
    let score = 0;

    // Must match: Type and Operation (critical filters)
    if (base.type !== compare.type) return 0;
    if (base.operation !== compare.operation) return 0;

    // Same type and operation: +50 points (baseline)
    score += 50;

    // Price similarity (±20% range): +30 points
    const basePrice = base.operation === OperationType.VENTA
        ? base.salePrice || 0
        : base.rentPrice || 0;
    const comparePrice = compare.operation === OperationType.VENTA
        ? compare.salePrice || 0
        : compare.rentPrice || 0;

    if (basePrice > 0 && comparePrice > 0) {
        const priceDiff = Math.abs(basePrice - comparePrice) / basePrice;
        if (priceDiff <= 0.2) {
            score += 30; // Within 20%
        } else if (priceDiff <= 0.4) {
            score += 15; // Within 40%
        }
    }

    // Location similarity
    if (base.address.city === compare.address.city) {
        score += 20; // Same city
        if (base.address.colony === compare.address.colony) {
            score += 10; // Same neighborhood
        }
    } else if (base.address.state === compare.address.state) {
        score += 5; // Same state
    }

    // Bedrooms similarity (±1 bedroom): +15 points
    const bedroomDiff = Math.abs(base.specs.bedrooms - compare.specs.bedrooms);
    if (bedroomDiff === 0) {
        score += 15;
    } else if (bedroomDiff === 1) {
        score += 8;
    }

    // Bathrooms similarity: +10 points
    const bathroomDiff = Math.abs(base.specs.bathrooms - compare.specs.bathrooms);
    if (bathroomDiff === 0) {
        score += 10;
    } else if (bathroomDiff <= 1) {
        score += 5;
    }

    // Size similarity (±20% m2): +10 points
    if (base.specs.m2Total > 0 && compare.specs.m2Total > 0) {
        const sizeDiff = Math.abs(base.specs.m2Total - compare.specs.m2Total) / base.specs.m2Total;
        if (sizeDiff <= 0.2) {
            score += 10;
        } else if (sizeDiff <= 0.4) {
            score += 5;
        }
    }

    // Shared amenities: +1 point per shared amenity (max 10)
    const sharedAmenities = base.amenities.filter(a =>
        compare.amenities.includes(a)
    ).length;
    score += Math.min(sharedAmenities, 10);

    return score;
}
