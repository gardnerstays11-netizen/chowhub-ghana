import { pgTable, text, uuid, timestamp, boolean, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vendorsTable } from "./vendors";

export const listingsTable = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  cuisineType: text("cuisine_type").array().notNull(),
  diningStyle: text("dining_style").notNull(),
  mealPeriod: text("meal_period").array().notNull(),
  priceRange: text("price_range").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  neighbourhood: text("neighbourhood").notNull().default(""),
  address: text("address").notNull(),
  landmark: text("landmark").notNull().default(""),
  lat: real("lat").notNull().default(0),
  lng: real("lng").notNull().default(0),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  website: text("website"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  openingHours: jsonb("opening_hours").notNull().default({}),
  features: text("features").array().notNull().default([]),
  dressCode: text("dress_code").notNull().default("casual"),
  acceptsReservations: boolean("accepts_reservations").notNull().default(false),
  acceptsOrders: boolean("accepts_orders").notNull().default(false),
  averageRating: real("average_rating").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  metaTitle: text("meta_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, averageRating: true, totalReviews: true, isFeatured: true, isVerified: true, status: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
