import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  testDb,
  createTestUser,
  createTestRequest,
  cleanupTestUser,
  closePool,
} from "./db-helpers";

const OWNER_EMAIL = "test-rq-owner@test.gamparts.dev";
const DEALER1_EMAIL = "test-rq-dealer1@test.gamparts.dev";
const DEALER2_EMAIL = "test-rq-dealer2@test.gamparts.dev";

describe("Part Requests & Quotes (Integration)", () => {
  let ownerId: string;
  let dealer1Id: string;
  let dealer2Id: string;

  beforeAll(async () => {
    await cleanupTestUser(OWNER_EMAIL);
    await cleanupTestUser(DEALER1_EMAIL);
    await cleanupTestUser(DEALER2_EMAIL);

    const owner = await createTestUser({
      email: OWNER_EMAIL,
      role: "vehicle_owner",
    });
    const dealer1 = await createTestUser({
      email: DEALER1_EMAIL,
      role: "dealer",
    });
    const dealer2 = await createTestUser({
      email: DEALER2_EMAIL,
      role: "dealer",
    });

    ownerId = owner.id;
    dealer1Id = dealer1.id;
    dealer2Id = dealer2.id;
  });

  afterAll(async () => {
    await cleanupTestUser(OWNER_EMAIL);
    await cleanupTestUser(DEALER1_EMAIL);
    await cleanupTestUser(DEALER2_EMAIL);
    await closePool();
  });

  it("should create a part request with open status", async () => {
    const request = await createTestRequest(ownerId);

    expect(request.partName).toBe("Brake Pads");
    expect(request.status).toBe("open");
    expect(request.requesterId).toBe(ownerId);
    expect(request.urgency).toBe("medium");
  });

  it("should allow a dealer to submit a quote", async () => {
    const request = await createTestRequest(ownerId);

    const [quote] = await testDb
      .insert(schema.quotes)
      .values({
        requestId: request.id,
        dealerId: dealer1Id,
        price: "3500.00",
        isAvailable: true,
        fulfillmentDays: 2,
        notes: "In stock, can deliver tomorrow",
      })
      .returning();

    expect(quote!.requestId).toBe(request.id);
    expect(quote!.dealerId).toBe(dealer1Id);
    expect(quote!.status).toBe("pending");
    expect(quote!.price).toBe("3500.00");
  });

  it("should enforce one quote per dealer per request (unique constraint)", async () => {
    const request = await createTestRequest(ownerId);

    await testDb.insert(schema.quotes).values({
      requestId: request.id,
      dealerId: dealer1Id,
      price: "3000.00",
      isAvailable: true,
      fulfillmentDays: 3,
    });

    await expect(
      testDb.insert(schema.quotes).values({
        requestId: request.id,
        dealerId: dealer1Id,
        price: "2800.00",
        isAvailable: true,
        fulfillmentDays: 2,
      }),
    ).rejects.toThrow();
  });

  it("should allow multiple dealers to quote the same request", async () => {
    const request = await createTestRequest(ownerId);

    await testDb.insert(schema.quotes).values({
      requestId: request.id,
      dealerId: dealer1Id,
      price: "3000.00",
      isAvailable: true,
      fulfillmentDays: 3,
    });

    const [quote2] = await testDb
      .insert(schema.quotes)
      .values({
        requestId: request.id,
        dealerId: dealer2Id,
        price: "2800.00",
        isAvailable: true,
        fulfillmentDays: 1,
      })
      .returning();

    expect(quote2!.dealerId).toBe(dealer2Id);

    const quotes = await testDb
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.requestId, request.id));

    expect(quotes).toHaveLength(2);
  });

  it("should accept a quote and decline others", async () => {
    const request = await createTestRequest(ownerId);

    const [quote1] = await testDb
      .insert(schema.quotes)
      .values({
        requestId: request.id,
        dealerId: dealer1Id,
        price: "4000.00",
        isAvailable: true,
        fulfillmentDays: 3,
      })
      .returning();

    const [quote2] = await testDb
      .insert(schema.quotes)
      .values({
        requestId: request.id,
        dealerId: dealer2Id,
        price: "3500.00",
        isAvailable: true,
        fulfillmentDays: 2,
      })
      .returning();

    // Accept quote2 (cheaper)
    await testDb
      .update(schema.quotes)
      .set({ status: "accepted" })
      .where(eq(schema.quotes.id, quote2!.id));

    // Decline quote1
    await testDb
      .update(schema.quotes)
      .set({ status: "declined" })
      .where(eq(schema.quotes.id, quote1!.id));

    // Update request status
    await testDb
      .update(schema.partRequests)
      .set({ status: "accepted" })
      .where(eq(schema.partRequests.id, request.id));

    // Verify
    const updatedQuote1 = await testDb.query.quotes.findFirst({
      where: eq(schema.quotes.id, quote1!.id),
    });
    const updatedQuote2 = await testDb.query.quotes.findFirst({
      where: eq(schema.quotes.id, quote2!.id),
    });
    const updatedRequest = await testDb.query.partRequests.findFirst({
      where: eq(schema.partRequests.id, request.id),
    });

    expect(updatedQuote1!.status).toBe("declined");
    expect(updatedQuote2!.status).toBe("accepted");
    expect(updatedRequest!.status).toBe("accepted");
  });

  it("should create notifications", async () => {
    await testDb.insert(schema.notifications).values({
      userId: ownerId,
      type: "quote_received",
      title: "New Quote",
      message: "A dealer submitted a quote for your request",
      link: "/requests/123",
    });

    const notifs = await testDb
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, ownerId),
          eq(schema.notifications.type, "quote_received"),
        ),
      );

    expect(notifs.length).toBeGreaterThanOrEqual(1);
    expect(notifs[0]!.isRead).toBe(false);
  });
});
