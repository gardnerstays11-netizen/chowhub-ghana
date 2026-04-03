import { pgTable, text, uuid, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const editorsPicksTable = pgTable("editors_picks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  listingIds: jsonb("listing_ids").notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EditorsPick = typeof editorsPicksTable.$inferSelect;
