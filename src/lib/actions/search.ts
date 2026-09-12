"use server";

import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  partListings,
  partVehicles,
  users,
  towns,
  partListingImages,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { haversineDistance } from "@/lib/towns";
import { eq, and, gt, sql, ilike, or } from "drizzle-orm";
import type { ActionResponse } from "@/lib/types";

const searchPartsSchema = z.object({
  query: z.string().min(1),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().optional(),
  sortBy: z
    .enum(["price", "distance", "availability", "relevance"])
    .default("relevance"),
  page: z.number().default(1),
  limit: z.number().max(50).default(20),
});

export type SearchPartsInput = z.infer<typeof searchPartsSchema>;

export interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  condition: "new" | "used" | "refurbished";
  isActive: boolean;
  fulfillmentDays: number;
  updatedAt: Date;
  dealerName: string;
  dealerTown: string;
  dealerRegion: string;
  images: { id: string; url: string; displayOrder: number }[];
  matchScore: number;
  distanceKm: number | null;
}

export interface SearchPartsResult {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  suggestion: string | null;
}

export async function searchParts(
  input: unknown,
): Promise<ActionResponse<SearchPartsResult>> {
  const parsed = searchPartsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid search parameters",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { query, vehicleMake, vehicleModel, vehicleYear, sortBy, page, limit } =
    parsed.data;
  const offset = (page - 1) * limit;

  try {
    const session = await auth();
    let userTown: { latitude: string; longitude: string } | null = null;

    if (session?.user?.townId) {
      const userTownResult = await db.query.towns.findFirst({
        where: eq(towns.id, session.user.townId),
      });
      userTown = userTownResult ?? null;
    }

    // Build the base query with ILIKE matching
    // Try pg_trgm similarity first, fall back to ILIKE only
    const likePattern = `%${query}%`;

    let matchScoreExpr;
    try {
      matchScoreExpr = sql<number>`
        COALESCE(similarity(${partListings.name}, ${query}), 0)
      `;
    } catch {
      // pg_trgm not available, use a basic score
      matchScoreExpr = sql<number>`
        CASE WHEN ${partListings.name} ILIKE ${likePattern} THEN 0.5 ELSE 0 END
      `;
    }

    // Build conditions
    const baseConditions = and(
      eq(partListings.isActive, true),
      gt(partListings.quantity, 0),
      or(
        sql`similarity(${partListings.name}, ${query}) > 0.1`,
        ilike(partListings.name, likePattern),
      ),
    );

    // Vehicle compatibility filter
    let vehicleConditions;
    if (vehicleMake || vehicleModel || vehicleYear) {
      const vehicleFilters = [];
      if (vehicleMake) {
        vehicleFilters.push(ilike(partVehicles.make, vehicleMake));
      }
      if (vehicleModel) {
        vehicleFilters.push(ilike(partVehicles.model, vehicleModel));
      }
      if (vehicleYear) {
        vehicleFilters.push(
          and(
            sql`${partVehicles.yearFrom} <= ${vehicleYear}`,
            sql`${partVehicles.yearTo} >= ${vehicleYear}`,
          ),
        );
      }
      vehicleConditions =
        vehicleFilters.length > 0 ? and(...vehicleFilters) : undefined;
    }

    // Determine sort expression
    let orderByExpr;
    switch (sortBy) {
      case "price":
        orderByExpr = sql`${partListings.price}::numeric ASC`;
        break;
      case "availability":
        orderByExpr = sql`${partListings.quantity} DESC`;
        break;
      case "distance":
        // Will sort in JS after fetching if user has town
        orderByExpr = sql`similarity(${partListings.name}, ${query}) DESC`;
        break;
      case "relevance":
      default:
        orderByExpr = sql`similarity(${partListings.name}, ${query}) DESC`;
        break;
    }

    // Build and execute query
    let resultsQuery;

    if (vehicleConditions) {
      resultsQuery = db
        .select({
          id: partListings.id,
          name: partListings.name,
          description: partListings.description,
          price: partListings.price,
          quantity: partListings.quantity,
          condition: partListings.condition,
          isActive: partListings.isActive,
          fulfillmentDays: partListings.fulfillmentDays,
          updatedAt: partListings.updatedAt,
          dealerName: users.name,
          dealerTownId: users.townId,
          townName: towns.name,
          townRegion: towns.region,
          townLatitude: towns.latitude,
          townLongitude: towns.longitude,
          matchScore: matchScoreExpr,
        })
        .from(partListings)
        .innerJoin(users, eq(partListings.dealerId, users.id))
        .innerJoin(towns, eq(users.townId, towns.id))
        .innerJoin(partVehicles, eq(partVehicles.listingId, partListings.id))
        .where(and(baseConditions, vehicleConditions))
        .orderBy(orderByExpr)
        .groupBy(
          partListings.id,
          users.name,
          users.townId,
          towns.name,
          towns.region,
          towns.latitude,
          towns.longitude,
        );
    } else {
      resultsQuery = db
        .select({
          id: partListings.id,
          name: partListings.name,
          description: partListings.description,
          price: partListings.price,
          quantity: partListings.quantity,
          condition: partListings.condition,
          isActive: partListings.isActive,
          fulfillmentDays: partListings.fulfillmentDays,
          updatedAt: partListings.updatedAt,
          dealerName: users.name,
          dealerTownId: users.townId,
          townName: towns.name,
          townRegion: towns.region,
          townLatitude: towns.latitude,
          townLongitude: towns.longitude,
          matchScore: matchScoreExpr,
        })
        .from(partListings)
        .innerJoin(users, eq(partListings.dealerId, users.id))
        .innerJoin(towns, eq(users.townId, towns.id))
        .where(baseConditions)
        .orderBy(orderByExpr);
    }

    // Fetch all matching rows (for total count and distance sorting)
    let rows;
    try {
      rows = await resultsQuery;
    } catch (e: unknown) {
      // If pg_trgm similarity function fails, fall back to ILIKE only
      const message = e instanceof Error ? e.message : "";
      if (message.includes("similarity")) {
        const fallbackConditions = and(
          eq(partListings.isActive, true),
          gt(partListings.quantity, 0),
          ilike(partListings.name, likePattern),
        );

        const fallbackScoreExpr = sql<number>`
          CASE WHEN ${partListings.name} ILIKE ${likePattern} THEN 0.5 ELSE 0 END
        `;

        const fallbackQuery = db
          .select({
            id: partListings.id,
            name: partListings.name,
            description: partListings.description,
            price: partListings.price,
            quantity: partListings.quantity,
            condition: partListings.condition,
            isActive: partListings.isActive,
            fulfillmentDays: partListings.fulfillmentDays,
            updatedAt: partListings.updatedAt,
            dealerName: users.name,
            dealerTownId: users.townId,
            townName: towns.name,
            townRegion: towns.region,
            townLatitude: towns.latitude,
            townLongitude: towns.longitude,
            matchScore: fallbackScoreExpr,
          })
          .from(partListings)
          .innerJoin(users, eq(partListings.dealerId, users.id))
          .innerJoin(towns, eq(users.townId, towns.id))
          .where(
            vehicleConditions
              ? and(fallbackConditions, vehicleConditions)
              : fallbackConditions,
          );

        if (vehicleConditions) {
          rows = await fallbackQuery;
        } else {
          rows = await fallbackQuery;
        }
      } else {
        throw e;
      }
    }

    // Calculate distance for each row
    const enrichedRows = rows.map((row) => {
      let distanceKm: number | null = null;
      if (userTown) {
        distanceKm = haversineDistance(
          parseFloat(userTown.latitude),
          parseFloat(userTown.longitude),
          parseFloat(row.townLatitude),
          parseFloat(row.townLongitude),
        );
        distanceKm = Math.round(distanceKm * 10) / 10;
      }
      return { ...row, distanceKm };
    });

    // Sort by distance if requested
    if (sortBy === "distance" && userTown) {
      enrichedRows.sort((a, b) => {
        const da = a.distanceKm ?? Infinity;
        const db = b.distanceKm ?? Infinity;
        return da - db;
      });
    }

    const total = enrichedRows.length;
    const totalPages = Math.ceil(total / limit);

    // Paginate
    const paginatedRows = enrichedRows.slice(offset, offset + limit);

    // Fetch images for paginated results
    const listingIds = paginatedRows.map((r) => r.id);
    let images: {
      id: string;
      listingId: string;
      url: string;
      displayOrder: number;
    }[] = [];
    if (listingIds.length > 0) {
      images = await db
        .select({
          id: partListingImages.id,
          listingId: partListingImages.listingId,
          url: partListingImages.url,
          displayOrder: partListingImages.displayOrder,
        })
        .from(partListingImages)
        .where(
          sql`${partListingImages.listingId} IN (${sql.join(
            listingIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );
    }

    // Group images by listing
    const imagesByListing = new Map<
      string,
      { id: string; url: string; displayOrder: number }[]
    >();
    for (const img of images) {
      const existing = imagesByListing.get(img.listingId) ?? [];
      existing.push({
        id: img.id,
        url: img.url,
        displayOrder: img.displayOrder,
      });
      imagesByListing.set(img.listingId, existing);
    }

    // Build results
    const results: SearchResult[] = paginatedRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      quantity: row.quantity,
      condition: row.condition,
      isActive: row.isActive,
      fulfillmentDays: row.fulfillmentDays,
      updatedAt: row.updatedAt,
      dealerName: row.dealerName,
      dealerTown: row.townName,
      dealerRegion: row.townRegion,
      images: (imagesByListing.get(row.id) ?? []).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
      matchScore: Number(row.matchScore),
      distanceKm: row.distanceKm,
    }));

    // Generate suggestion if best match score is low
    let suggestion: string | null = null;
    if (results.length > 0) {
      const bestScore = Math.max(...results.map((r) => r.matchScore));
      if (bestScore < 0.3) {
        suggestion = results[0]?.name ?? null;
      }
    }

    return {
      success: true,
      data: {
        results,
        total,
        page,
        totalPages,
        suggestion,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
