import { pgTable, text, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { listingsTable } from "./listings";

export const listingPhotosTable = pgTable("listing_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  url: text("url").notNull(),
  isCover: boolean("is_cover").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertListingPhotoSchema = createInsertSchema(listingPhotosTable).omit({ id: true });
export type InsertListingPhoto = z.infer<typeof insertListingPhotoSchema>;
export type ListingPhoto = typeof listingPhotosTable.$inferSelect;
