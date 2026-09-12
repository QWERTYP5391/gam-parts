"use server";

import { z } from "zod/v4";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { partRequests, quotes, users } from "@/lib/db/schema";
import { createNotification } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/lib/types";

const createPartRequestSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().int().positive().optional(),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  notes: z.string().optional(),
});

export async function createPartRequest(
  input: z.infer<typeof createPartRequestSchema>,
): Promise<ActionResponse<{ id: string; status: "open" }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  if (
    session.user.role !== "vehicle_owner" &&
    session.user.role !== "mechanic"
  ) {
    return {
      success: false,
      error: "Only vehicle owners and mechanics can create part requests",
    };
  }

  const parsed = createPartRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { partName, vehicleMake, vehicleModel, vehicleYear, urgency, notes } =
    parsed.data;

  const [request] = await db
    .insert(partRequests)
    .values({
      requesterId: session.user.id,
      partName,
      vehicleMake: vehicleMake ?? null,
      vehicleModel: vehicleModel ?? null,
      vehicleYear: vehicleYear ?? null,
      urgency,
      notes: notes ?? null,
    })
    .returning({ id: partRequests.id, status: partRequests.status });

  if (!request) {
    return { success: false, error: "Failed to create part request" };
  }

  // Notify all dealers
  const dealers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "dealer"));

  for (const dealer of dealers) {
    await createNotification({
      userId: dealer.id,
      type: "new_request",
      title: "New Part Request",
      message: `A new request for "${partName}" has been posted.`,
      link: `/requests/${request.id}`,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/requests");

  return { success: true, data: { id: request.id, status: "open" } };
}

const submitQuoteSchema = z.object({
  requestId: z.string().uuid(),
  price: z.number().positive("Price must be positive"),
  isAvailable: z.boolean(),
  fulfillmentDays: z
    .number()
    .int()
    .positive("Fulfillment days must be a positive integer"),
  notes: z.string().optional(),
});

export async function submitQuote(
  input: z.infer<typeof submitQuoteSchema>,
): Promise<ActionResponse<{ id: string; status: "pending" }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  if (session.user.role !== "dealer") {
    return { success: false, error: "Only dealers can submit quotes" };
  }

  const parsed = submitQuoteSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { requestId, price, isAvailable, fulfillmentDays, notes } = parsed.data;

  // Validate request exists and is not accepted
  const request = await db.query.partRequests.findFirst({
    where: eq(partRequests.id, requestId),
  });

  if (!request) {
    return { success: false, error: "Part request not found" };
  }

  if (request.status === "accepted") {
    return { success: false, error: "This request has already been accepted" };
  }

  // Check for existing quote from this dealer
  const existingQuote = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.requestId, requestId),
      eq(quotes.dealerId, session.user.id),
    ),
  });

  if (existingQuote) {
    return {
      success: false,
      error: "You have already submitted a quote for this request",
    };
  }

  const [quote] = await db
    .insert(quotes)
    .values({
      requestId,
      dealerId: session.user.id,
      price: price.toFixed(2),
      isAvailable,
      fulfillmentDays,
      notes: notes ?? null,
    })
    .returning({ id: quotes.id, status: quotes.status });

  if (!quote) {
    return { success: false, error: "Failed to submit quote" };
  }

  // If this is the first quote, update request status to 'quoted'
  if (request.status === "open") {
    await db
      .update(partRequests)
      .set({ status: "quoted", updatedAt: new Date() })
      .where(eq(partRequests.id, requestId));
  }

  // Notify the requester
  await createNotification({
    userId: request.requesterId,
    type: "new_quote",
    title: "New Quote Received",
    message: `A dealer has submitted a quote for your "${request.partName}" request.`,
    link: `/requests/${requestId}`,
  });

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");

  return { success: true, data: { id: quote.id, status: "pending" } };
}

const acceptQuoteSchema = z.object({
  quoteId: z.string().uuid(),
});

export async function acceptQuote(
  input: z.infer<typeof acceptQuoteSchema>,
): Promise<
  ActionResponse<{ requestId: string; dealerId: string; status: "accepted" }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = acceptQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  // Get the quote with its request
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, parsed.data.quoteId),
    with: {
      request: true,
    },
  });

  if (!quote) {
    return { success: false, error: "Quote not found" };
  }

  // Verify the current user is the requester
  if (quote.request.requesterId !== session.user.id) {
    return { success: false, error: "Only the requester can accept quotes" };
  }

  if (quote.request.status === "accepted") {
    return {
      success: false,
      error: "A quote has already been accepted for this request",
    };
  }

  // Accept this quote
  await db
    .update(quotes)
    .set({ status: "accepted" })
    .where(eq(quotes.id, parsed.data.quoteId));

  // Decline all other quotes on the same request
  await db
    .update(quotes)
    .set({ status: "declined" })
    .where(
      and(
        eq(quotes.requestId, quote.requestId),
        ne(quotes.id, parsed.data.quoteId),
      ),
    );

  // Update request status to accepted
  await db
    .update(partRequests)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(partRequests.id, quote.requestId));

  // Notify the accepted dealer
  await createNotification({
    userId: quote.dealerId,
    type: "quote_accepted",
    title: "Quote Accepted",
    message: `Your quote for "${quote.request.partName}" has been accepted!`,
    link: `/requests/${quote.requestId}`,
  });

  revalidatePath(`/requests/${quote.requestId}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");

  return {
    success: true,
    data: {
      requestId: quote.requestId,
      dealerId: quote.dealerId,
      status: "accepted",
    },
  };
}
