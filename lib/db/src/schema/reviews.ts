import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { listingsTable } from "./listings";
import { usersTable } from "./users";

export const reviewsTable = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  rating: integer("rating").notNull(),
  foodRating: integer("food_rating").notNull(),
  serviceRating: integer("service_rating").notNull(),
  ambienceRating: integer("ambience_rating").notNull(),
  valueRating: integer("value_rating").notNull(),
  comment: text("comment").notNull(),
  visitedFor: text("visited_for").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
