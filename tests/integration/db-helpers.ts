import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://gamparts:gamparts_dev@localhost:5433/gamparts";

const pool = new Pool({ connectionString: DATABASE_URL });
export const testDb = drizzle(pool, { schema });

let townId: number | null = null;

export async function getTestTownId(): Promise<number> {
  if (townId) return townId;
  const town = await testDb.query.towns.findFirst();
  if (!town) throw new Error("No towns in database. Run seed first.");
  townId = town.id;
  return townId;
}

export async function getSecondTownId(): Promise<number> {
  const towns = await testDb
    .select()
    .from(schema.towns)
    .limit(2);
  if (towns.length < 2) throw new Error("Need at least 2 towns in database.");
  return towns[1]!.id;
}

export async function createTestUser(overrides: {
  email: string;
  role: "vehicle_owner" | "mechanic" | "dealer";
  townId?: number;
}) {
  const tid = overrides.townId ?? (await getTestTownId());
  const passwordHash = await bcrypt.hash("TestPass123!", 4); // low rounds for speed

  const [user] = await testDb
    .insert(schema.users)
    .values({
      email: overrides.email,
      passwordHash,
      name: `Test ${overrides.role}`,
      phone: "+2201234567",
      role: overrides.role,
      townId: tid,
    })
    .returning();

  return user!;
}

export async function createTestListing(dealerId: string, name: string) {
  const [listing] = await testDb
    .insert(schema.partListings)
    .values({
      dealerId,
      name,
      price: "1500.00",
      quantity: 5,
      condition: "new",
      fulfillmentDays: 2,
    })
    .returning();

  await testDb.insert(schema.partVehicles).values({
    listingId: listing!.id,
    make: "Toyota",
    model: "Corolla",
    yearFrom: 2015,
    yearTo: 2023,
  });

  return listing!;
}

export async function createTestRequest(requesterId: string) {
  const [request] = await testDb
    .insert(schema.partRequests)
    .values({
      requesterId,
      partName: "Brake Pads",
      vehicleMake: "Toyota",
      vehicleModel: "Corolla",
      vehicleYear: 2020,
      urgency: "medium",
    })
    .returning();

  return request!;
}

export async function cleanupTestUser(email: string) {
  const user = await testDb.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  if (!user) return;

  // Clean up in reverse dependency order
  await testDb
    .delete(schema.notifications)
    .where(eq(schema.notifications.userId, user.id));

  await testDb
    .delete(schema.dealerStats)
    .where(eq(schema.dealerStats.dealerId, user.id));

  // Delete quotes by this dealer
  await testDb
    .delete(schema.quotes)
    .where(eq(schema.quotes.dealerId, user.id));

  // Delete requests by this user
  const requests = await testDb
    .select({ id: schema.partRequests.id })
    .from(schema.partRequests)
    .where(eq(schema.partRequests.requesterId, user.id));

  for (const req of requests) {
    await testDb
      .delete(schema.quotes)
      .where(eq(schema.quotes.requestId, req.id));
    await testDb
      .delete(schema.partRequests)
      .where(eq(schema.partRequests.id, req.id));
  }

  // Delete listings by this dealer
  await testDb
    .delete(schema.partListings)
    .where(eq(schema.partListings.dealerId, user.id));

  await testDb.delete(schema.users).where(eq(schema.users.id, user.id));
}

export async function closePool() {
  await pool.end();
}
