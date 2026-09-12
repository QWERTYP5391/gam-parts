import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  serial,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "vehicle_owner",
  "mechanic",
  "dealer",
]);

export const partConditionEnum = pgEnum("part_condition", [
  "new",
  "used",
  "refurbished",
]);

export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high"]);

export const requestStatusEnum = pgEnum("request_status", [
  "open",
  "quoted",
  "accepted",
  "fulfilled",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "pending",
  "accepted",
  "declined",
]);

// Tables
export const towns = pgTable("towns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  region: varchar("region", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 9, scale: 6 }).notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  role: userRoleEnum("role").notNull(),
  townId: integer("town_id")
    .notNull()
    .references(() => towns.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partListings = pgTable(
  "part_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    condition: partConditionEnum("condition").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    fulfillmentDays: integer("fulfillment_days").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("part_listings_dealer_active_idx").on(table.dealerId, table.isActive),
    index("part_listings_active_quantity_idx").on(
      table.isActive,
      table.quantity,
    ),
  ],
);

export const partListingImages = pgTable("part_listing_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => partListings.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partVehicles = pgTable(
  "part_vehicles",
  {
    id: serial("id").primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => partListings.id, { onDelete: "cascade" }),
    make: varchar("make", { length: 100 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    yearFrom: integer("year_from").notNull(),
    yearTo: integer("year_to").notNull(),
  },
  (table) => [
    index("part_vehicles_compatibility_idx").on(
      table.make,
      table.model,
      table.yearFrom,
      table.yearTo,
    ),
    index("part_vehicles_listing_idx").on(table.listingId),
  ],
);

export const partRequests = pgTable(
  "part_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id),
    partName: varchar("part_name", { length: 255 }).notNull(),
    vehicleMake: varchar("vehicle_make", { length: 100 }),
    vehicleModel: varchar("vehicle_model", { length: 100 }),
    vehicleYear: integer("vehicle_year"),
    urgency: urgencyEnum("urgency").notNull().default("medium"),
    notes: text("notes"),
    status: requestStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("part_requests_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => partRequests.id),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => users.id),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    isAvailable: boolean("is_available").notNull(),
    fulfillmentDays: integer("fulfillment_days").notNull(),
    notes: text("notes"),
    status: quoteStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("quotes_request_dealer_unique").on(
      table.requestId,
      table.dealerId,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    link: varchar("link", { length: 500 }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_read_created_idx").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
  ],
);

export const dealerStats = pgTable("dealer_stats", {
  dealerId: uuid("dealer_id")
    .primaryKey()
    .references(() => users.id),
  totalQuotes: integer("total_quotes").notNull().default(0),
  acceptedQuotes: integer("accepted_quotes").notNull().default(0),
  avgResponseHours: decimal("avg_response_hours", {
    precision: 6,
    scale: 1,
  }),
  avgFulfillmentDays: decimal("avg_fulfillment_days", {
    precision: 4,
    scale: 1,
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const townsRelations = relations(towns, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  town: one(towns, {
    fields: [users.townId],
    references: [towns.id],
  }),
  partListings: many(partListings),
  partRequests: many(partRequests),
  quotes: many(quotes),
  notifications: many(notifications),
  dealerStats: one(dealerStats, {
    fields: [users.id],
    references: [dealerStats.dealerId],
  }),
}));

export const partListingsRelations = relations(
  partListings,
  ({ one, many }) => ({
    dealer: one(users, {
      fields: [partListings.dealerId],
      references: [users.id],
    }),
    images: many(partListingImages),
    vehicles: many(partVehicles),
  }),
);

export const partListingImagesRelations = relations(
  partListingImages,
  ({ one }) => ({
    listing: one(partListings, {
      fields: [partListingImages.listingId],
      references: [partListings.id],
    }),
  }),
);

export const partVehiclesRelations = relations(partVehicles, ({ one }) => ({
  listing: one(partListings, {
    fields: [partVehicles.listingId],
    references: [partListings.id],
  }),
}));

export const partRequestsRelations = relations(
  partRequests,
  ({ one, many }) => ({
    requester: one(users, {
      fields: [partRequests.requesterId],
      references: [users.id],
    }),
    quotes: many(quotes),
  }),
);

export const quotesRelations = relations(quotes, ({ one }) => ({
  request: one(partRequests, {
    fields: [quotes.requestId],
    references: [partRequests.id],
  }),
  dealer: one(users, {
    fields: [quotes.dealerId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const dealerStatsRelations = relations(dealerStats, ({ one }) => ({
  dealer: one(users, {
    fields: [dealerStats.dealerId],
    references: [users.id],
  }),
}));
