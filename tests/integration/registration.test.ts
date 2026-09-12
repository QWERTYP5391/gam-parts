import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "@/lib/db/schema";
import {
  testDb,
  getTestTownId,
  cleanupTestUser,
  closePool,
} from "./db-helpers";

const TEST_EMAIL_PREFIX = "test-reg";

function testEmail(suffix: string) {
  return `${TEST_EMAIL_PREFIX}-${suffix}@test.gamparts.dev`;
}

describe("User Registration (Integration)", () => {
  let townId: number;

  beforeAll(async () => {
    townId = await getTestTownId();
  });

  afterEach(async () => {
    // Clean up any test users created during the test
    await cleanupTestUser(testEmail("owner"));
    await cleanupTestUser(testEmail("mechanic"));
    await cleanupTestUser(testEmail("dealer"));
    await cleanupTestUser(testEmail("duplicate"));
  });

  afterAll(async () => {
    await closePool();
  });

  it("should create a vehicle_owner user with hashed password", async () => {
    const email = testEmail("owner");
    const passwordHash = await bcrypt.hash("SecurePass123!", 4);

    const [user] = await testDb
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name: "Test Owner",
        phone: "+2201111111",
        role: "vehicle_owner",
        townId,
      })
      .returning();

    expect(user).toBeDefined();
    expect(user!.email).toBe(email);
    expect(user!.role).toBe("vehicle_owner");
    expect(user!.townId).toBe(townId);
    expect(user!.passwordHash).not.toBe("SecurePass123!");

    const matches = await bcrypt.compare("SecurePass123!", user!.passwordHash);
    expect(matches).toBe(true);
  });

  it("should create users with all three roles", async () => {
    const roles = ["vehicle_owner", "mechanic", "dealer"] as const;

    for (const role of roles) {
      const email = testEmail(role);
      const passwordHash = await bcrypt.hash("Pass123!", 4);

      const [user] = await testDb
        .insert(schema.users)
        .values({
          email,
          passwordHash,
          name: `Test ${role}`,
          phone: "+2201111111",
          role,
          townId,
        })
        .returning();

      expect(user!.role).toBe(role);
    }
  });

  it("should reject duplicate email addresses", async () => {
    const email = testEmail("duplicate");
    const passwordHash = await bcrypt.hash("Pass123!", 4);

    await testDb.insert(schema.users).values({
      email,
      passwordHash,
      name: "First User",
      phone: "+2201111111",
      role: "vehicle_owner",
      townId,
    });

    await expect(
      testDb.insert(schema.users).values({
        email,
        passwordHash,
        name: "Second User",
        phone: "+2202222222",
        role: "mechanic",
        townId,
      }),
    ).rejects.toThrow();
  });

  it("should set createdAt and updatedAt automatically", async () => {
    const email = testEmail("owner");
    const passwordHash = await bcrypt.hash("Pass123!", 4);

    const [user] = await testDb
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name: "Test Timestamps",
        phone: "+2201111111",
        role: "vehicle_owner",
        townId,
      })
      .returning();

    expect(user!.createdAt).toBeInstanceOf(Date);
    expect(user!.updatedAt).toBeInstanceOf(Date);
  });
});
