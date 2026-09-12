"use server";

import { z } from "zod/v4";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { partListings, partVehicles } from "@/lib/db/schema";
import type { ActionResponse } from "@/lib/types";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  yearFrom: z.number().int().min(1900),
  yearTo: z.number().int().min(1900),
});

const addPartListingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  condition: z.enum(["new", "used", "refurbished"]),
  fulfillmentDays: z.number().int().positive().default(1),
  vehicles: z.array(vehicleSchema).min(1, "At least one vehicle is required"),
});

const updatePartListingSchema = z.object({
  listingId: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
  condition: z.enum(["new", "used", "refurbished"]).optional(),
  fulfillmentDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  vehicles: z.array(vehicleSchema).min(1).optional(),
});

const deletePartListingSchema = z.object({
  listingId: z.string().uuid(),
});

export async function addPartListing(
  input: z.infer<typeof addPartListingSchema>,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "dealer") {
      return { success: false, error: "Unauthorized. Dealer role required." };
    }

    const parsed = addPartListingSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path]!.push(issue.message);
      }
      return { success: false, error: "Validation failed", fieldErrors };
    }

    const { vehicles, ...listingData } = parsed.data;

    const [listing] = await db
      .insert(partListings)
      .values({
        dealerId: session.user.id,
        name: listingData.name,
        description: listingData.description ?? null,
        price: listingData.price.toString(),
        quantity: listingData.quantity,
        condition: listingData.condition,
        fulfillmentDays: listingData.fulfillmentDays,
      })
      .returning({ id: partListings.id });

    if (!listing) {
      return { success: false, error: "Failed to create listing" };
    }

    await db.insert(partVehicles).values(
      vehicles.map((v) => ({
        listingId: listing.id,
        make: v.make,
        model: v.model,
        yearFrom: v.yearFrom,
        yearTo: v.yearTo,
      })),
    );

    revalidatePath("/inventory");

    return { success: true, data: { id: listing.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updatePartListing(
  input: z.infer<typeof updatePartListingSchema>,
): Promise<ActionResponse<{ id: string; updatedAt: Date }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "dealer") {
      return { success: false, error: "Unauthorized. Dealer role required." };
    }

    const parsed = updatePartListingSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path]!.push(issue.message);
      }
      return { success: false, error: "Validation failed", fieldErrors };
    }

    const { listingId, vehicles, ...updateData } = parsed.data;

    // Verify ownership
    const existing = await db.query.partListings.findFirst({
      where: and(
        eq(partListings.id, listingId),
        eq(partListings.dealerId, session.user.id),
      ),
    });

    if (!existing) {
      return { success: false, error: "Listing not found or not owned by you" };
    }

    const now = new Date();

    const updateValues: Record<string, unknown> = { updatedAt: now };
    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.description !== undefined)
      updateValues.description = updateData.description;
    if (updateData.price !== undefined)
      updateValues.price = updateData.price.toString();
    if (updateData.quantity !== undefined)
      updateValues.quantity = updateData.quantity;
    if (updateData.condition !== undefined)
      updateValues.condition = updateData.condition;
    if (updateData.fulfillmentDays !== undefined)
      updateValues.fulfillmentDays = updateData.fulfillmentDays;
    if (updateData.isActive !== undefined)
      updateValues.isActive = updateData.isActive;

    const [updated] = await db
      .update(partListings)
      .set(updateValues)
      .where(eq(partListings.id, listingId))
      .returning({ id: partListings.id, updatedAt: partListings.updatedAt });

    if (!updated) {
      return { success: false, error: "Failed to update listing" };
    }

    if (vehicles) {
      await db
        .delete(partVehicles)
        .where(eq(partVehicles.listingId, listingId));
      await db.insert(partVehicles).values(
        vehicles.map((v) => ({
          listingId,
          make: v.make,
          model: v.model,
          yearFrom: v.yearFrom,
          yearTo: v.yearTo,
        })),
      );
    }

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${listingId}/edit`);

    return {
      success: true,
      data: { id: updated.id, updatedAt: updated.updatedAt },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deletePartListing(
  input: z.infer<typeof deletePartListingSchema>,
): Promise<ActionResponse<{ deleted: true }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "dealer") {
      return { success: false, error: "Unauthorized. Dealer role required." };
    }

    const parsed = deletePartListingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid listing ID" };
    }

    const { listingId } = parsed.data;

    // Verify ownership
    const existing = await db.query.partListings.findFirst({
      where: and(
        eq(partListings.id, listingId),
        eq(partListings.dealerId, session.user.id),
      ),
    });

    if (!existing) {
      return { success: false, error: "Listing not found or not owned by you" };
    }

    // Images and vehicles cascade delete via schema
    await db.delete(partListings).where(eq(partListings.id, listingId));

    revalidatePath("/inventory");

    return { success: true, data: { deleted: true } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
