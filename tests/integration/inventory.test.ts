import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  testDb,
  createTestUser,
  createTestListing,
  cleanupTestUser,
  closePool,
} from "./db-helpers";

const DEALER_EMAIL = "test-inv-dealer@test.gamparts.dev";

describe("Dealer Inventory (Integration)", () => {
  let dealerId: string;

  beforeAll(async () => {
    await cleanupTestUser(DEALER_EMAIL);
    const dealer = await createTestUser({
      email: DEALER_EMAIL,
      role: "dealer",
    });
    dealerId = dealer.id;
  });

  afterAll(async () => {
    await cleanupTestUser(DEALER_EMAIL);
    await closePool();
  });

  it("should create a part listing with vehicle compatibility", async () => {
    const listing = await createTestListing(dealerId, "Brake Pads Front");

    expect(listing.name).toBe("Brake Pads Front");
    expect(listing.dealerId).toBe(dealerId);
    expect(listing.quantity).toBe(5);
    expect(listing.condition).toBe("new");
    expect(listing.isActive).toBe(true);

    // Verify vehicle was created
    const vehicles = await testDb
      .select()
      .from(schema.partVehicles)
      .where(eq(schema.partVehicles.listingId, listing.id));

    expect(vehicles).toHaveLength(1);
    expect(vehicles[0]!.make).toBe("Toyota");
    expect(vehicles[0]!.model).toBe("Corolla");
    expect(vehicles[0]!.yearFrom).toBe(2015);
    expect(vehicles[0]!.yearTo).toBe(2023);
  });

  it("should update a listing price", async () => {
    const listing = await createTestListing(dealerId, "Oil Filter");

    await testDb
      .update(schema.partListings)
      .set({ price: "2500.00", updatedAt: new Date() })
      .where(eq(schema.partListings.id, listing.id));

    const updated = await testDb.query.partListings.findFirst({
      where: eq(schema.partListings.id, listing.id),
    });

    expect(updated!.price).toBe("2500.00");
  });

  it("should deactivate a listing", async () => {
    const listing = await createTestListing(dealerId, "Air Filter");

    await testDb
      .update(schema.partListings)
      .set({ isActive: false })
      .where(eq(schema.partListings.id, listing.id));

    const updated = await testDb.query.partListings.findFirst({
      where: eq(schema.partListings.id, listing.id),
    });

    expect(updated!.isActive).toBe(false);
  });

  it("should cascade delete vehicles when listing is deleted", async () => {
    const listing = await createTestListing(dealerId, "Spark Plugs");
    const listingId = listing.id;

    // Verify vehicle exists
    const vehiclesBefore = await testDb
      .select()
      .from(schema.partVehicles)
      .where(eq(schema.partVehicles.listingId, listingId));
    expect(vehiclesBefore).toHaveLength(1);

    // Delete listing
    await testDb
      .delete(schema.partListings)
      .where(eq(schema.partListings.id, listingId));

    // Verify vehicle was cascade-deleted
    const vehiclesAfter = await testDb
      .select()
      .from(schema.partVehicles)
      .where(eq(schema.partVehicles.listingId, listingId));
    expect(vehiclesAfter).toHaveLength(0);
  });

  it("should list only dealer's own listings", async () => {
    await createTestListing(dealerId, "Alternator");

    const listings = await testDb
      .select()
      .from(schema.partListings)
      .where(eq(schema.partListings.dealerId, dealerId));

    for (const listing of listings) {
      expect(listing.dealerId).toBe(dealerId);
    }
    expect(listings.length).toBeGreaterThanOrEqual(1);
  });
});
