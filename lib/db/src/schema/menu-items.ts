import { pgTable, text, uuid, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { listingsTable } from "./listings";

export const menuItemsTable = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: real("price"),
  category: text("category").notNull(),
  photoUrl: text("photo_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  isPopular: boolean("is_popular").notNull().default(false),
});

export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;
