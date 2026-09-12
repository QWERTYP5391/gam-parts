import { haversineDistance } from "@/lib/towns";

interface DealerMatchInput {
  similarityScore: number;
  dealerLat: number;
  dealerLon: number;
  userLat: number;
  userLon: number;
  totalQuotes: number;
  acceptedQuotes: number;
  avgResponseHours: number | null;
  avgFulfillmentDays: number | null;
}

interface MatchResult {
  matchScore: number;
  distanceKm: number;
}

const WEIGHTS = {
  matchAccuracy: 0.4,
  proximity: 0.3,
  responseRate: 0.15,
  fulfillmentReliability: 0.15,
};

const MAX_DISTANCE_KM = 400; // Approximate length of The Gambia

/**
 * Calculate a weighted match score for a dealer.
 * Returns a score between 0 and 1, where higher is better.
 */
export function calculateMatchScore(input: DealerMatchInput): MatchResult {
  const distanceKm = haversineDistance(
    input.userLat,
    input.userLon,
    input.dealerLat,
    input.dealerLon,
  );

  // Match accuracy: directly from pg_trgm similarity (0-1)
  const matchAccuracy = Math.min(input.similarityScore, 1);

  // Proximity: inverse of distance, normalized to 0-1
  const proximityScore = Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM);

  // Response rate: ratio of accepted quotes to total quotes
  // New dealers (no quotes) get neutral 0.5
  const responseRate =
    input.totalQuotes > 0 ? input.acceptedQuotes / input.totalQuotes : 0.5;

  // Fulfillment reliability: based on avg fulfillment days
  // Lower days = higher score. Neutral 0.5 for new dealers.
  let fulfillmentReliability = 0.5;
  if (input.avgFulfillmentDays !== null) {
    // 1 day = score 1.0, 7+ days = score ~0.14
    fulfillmentReliability = Math.min(1, 1 / input.avgFulfillmentDays);
  }

  const matchScore =
    WEIGHTS.matchAccuracy * matchAccuracy +
    WEIGHTS.proximity * proximityScore +
    WEIGHTS.responseRate * responseRate +
    WEIGHTS.fulfillmentReliability * fulfillmentReliability;

  return {
    matchScore: Math.round(matchScore * 1000) / 1000,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}
