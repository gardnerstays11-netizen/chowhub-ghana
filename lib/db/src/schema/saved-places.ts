import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { listingsTable } from "./listings";
import { usersTable } from "./users";

export const savedPlacesTable = pgTable("saved_places", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedPlaceSchema = createInsertSchema(savedPlacesTable).omit({ id: true, createdAt: true });
export type InsertSavedPlace = z.infer<typeof insertSavedPlaceSchema>;
export type SavedPlace = typeof savedPlacesTable.$inferSelect;
