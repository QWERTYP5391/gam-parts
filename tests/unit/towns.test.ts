import { describe, it, expect } from "vitest";
import { haversineDistance } from "@/lib/towns";

describe("haversineDistance", () => {
  it("should return 0 for identical coordinates", () => {
    const distance = haversineDistance(13.4531, -16.5775, 13.4531, -16.5775);
    expect(distance).toBe(0);
  });

  it("should calculate distance between Banjul and Basse (known ~370km)", () => {
    // Banjul: 13.4531, -16.5775
    // Basse: 13.3167, -14.6500
    const distance = haversineDistance(13.4531, -16.5775, 13.3167, -14.65);
    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(400);
  });

  it("should calculate distance between Banjul and Serrekunda (short distance ~12km)", () => {
    // Banjul: 13.4531, -16.5775
    // Serrekunda: 13.4395, -16.6779
    const distance = haversineDistance(13.4531, -16.5775, 13.4395, -16.6779);
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(20);
  });

  it("should be symmetric (A to B equals B to A)", () => {
    const ab = haversineDistance(13.4531, -16.5775, 13.3167, -14.65);
    const ba = haversineDistance(13.3167, -14.65, 13.4531, -16.5775);
    expect(ab).toBeCloseTo(ba, 10);
  });

  it("should handle same latitude, different longitude", () => {
    const distance = haversineDistance(13.0, -16.0, 13.0, -15.0);
    // 1 degree of longitude at ~13°N ≈ 108km
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it("should handle same longitude, different latitude", () => {
    const distance = haversineDistance(13.0, -16.0, 14.0, -16.0);
    // 1 degree of latitude ≈ 111km
    expect(distance).toBeGreaterThan(105);
    expect(distance).toBeLessThan(115);
  });
});
