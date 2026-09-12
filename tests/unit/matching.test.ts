import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "@/lib/matching";

describe("calculateMatchScore", () => {
  const baseInput = {
    similarityScore: 0.8,
    dealerLat: 13.4531,
    dealerLon: -16.5775,
    userLat: 13.4531,
    userLon: -16.5775,
    totalQuotes: 10,
    acceptedQuotes: 8,
    avgResponseHours: 2,
    avgFulfillmentDays: 1,
  };

  it("should return a score between 0 and 1", () => {
    const result = calculateMatchScore(baseInput);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(1);
  });

  it("should return 0 distance for same location", () => {
    const result = calculateMatchScore(baseInput);
    expect(result.distanceKm).toBe(0);
  });

  it("should give higher score to closer dealers", () => {
    const closeDealer = calculateMatchScore({
      ...baseInput,
      dealerLat: 13.44,
      dealerLon: -16.58,
    });
    const farDealer = calculateMatchScore({
      ...baseInput,
      dealerLat: 13.3167,
      dealerLon: -14.65,
    });
    expect(closeDealer.matchScore).toBeGreaterThan(farDealer.matchScore);
  });

  it("should give higher score to better similarity", () => {
    const highSim = calculateMatchScore({
      ...baseInput,
      similarityScore: 0.95,
    });
    const lowSim = calculateMatchScore({
      ...baseInput,
      similarityScore: 0.3,
    });
    expect(highSim.matchScore).toBeGreaterThan(lowSim.matchScore);
  });

  it("should give new dealers (no quotes) a neutral 0.5 response rate", () => {
    const newDealer = calculateMatchScore({
      ...baseInput,
      totalQuotes: 0,
      acceptedQuotes: 0,
      avgResponseHours: null,
      avgFulfillmentDays: null,
    });
    const goodDealer = calculateMatchScore({
      ...baseInput,
      totalQuotes: 100,
      acceptedQuotes: 95,
    });
    // New dealer with neutral scores should be lower than a proven good dealer
    expect(newDealer.matchScore).toBeLessThan(goodDealer.matchScore);
    // responseRate for new dealer = 0.5, fulfillmentReliability = 0.5
    // component: 0.15 * 0.5 + 0.15 * 0.5 = 0.15
    // matchAccuracy: 0.4 * 0.8 = 0.32, proximity: 0.3 * 1.0 = 0.3
    // total = 0.32 + 0.3 + 0.075 + 0.075 = 0.77
    expect(newDealer.matchScore).toBeCloseTo(0.77, 2);
  });

  it("should penalize slow fulfillment", () => {
    const fastDealer = calculateMatchScore({
      ...baseInput,
      avgFulfillmentDays: 1,
    });
    const slowDealer = calculateMatchScore({
      ...baseInput,
      avgFulfillmentDays: 7,
    });
    expect(fastDealer.matchScore).toBeGreaterThan(slowDealer.matchScore);
  });

  it("should cap similarity score at 1.0", () => {
    const result = calculateMatchScore({
      ...baseInput,
      similarityScore: 1.5,
    });
    // If similarity > 1 were not capped, matchAccuracy component would exceed 0.4
    expect(result.matchScore).toBeLessThanOrEqual(1);
  });

  it("should handle zero distance correctly (proximity = 1.0)", () => {
    const result = calculateMatchScore(baseInput);
    // proximity component = 0.3 * 1.0 = 0.3
    // matchAccuracy component = 0.4 * 0.8 = 0.32
    // responseRate component = 0.15 * 0.8 = 0.12
    // fulfillmentReliability component = 0.15 * 1.0 = 0.15
    // total = 0.32 + 0.3 + 0.12 + 0.15 = 0.89
    expect(result.matchScore).toBeCloseTo(0.89, 2);
  });

  it("should calculate correct distanceKm", () => {
    const result = calculateMatchScore({
      ...baseInput,
      dealerLat: 13.3167,
      dealerLon: -14.65,
    });
    // Banjul to Basse ~210km
    expect(result.distanceKm).toBeGreaterThan(200);
    expect(result.distanceKm).toBeLessThan(400);
  });

  it("should round matchScore to 3 decimal places", () => {
    const result = calculateMatchScore(baseInput);
    const decimals = result.matchScore.toString().split(".")[1];
    if (decimals) {
      expect(decimals.length).toBeLessThanOrEqual(3);
    }
  });

  it("should round distanceKm to 1 decimal place", () => {
    const result = calculateMatchScore({
      ...baseInput,
      dealerLat: 13.44,
      dealerLon: -16.58,
    });
    const decimals = result.distanceKm.toString().split(".")[1];
    if (decimals) {
      expect(decimals.length).toBeLessThanOrEqual(1);
    }
  });
});
