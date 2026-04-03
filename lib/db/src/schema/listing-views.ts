import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { listingsTable } from "./listings";
import { usersTable } from "./users";

export const listingViewsTable = pgTable("listing_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  userId: uuid("user_id").references(() => usersTable.id),
  sessionId: text("session_id"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ListingView = typeof listingViewsTable.$inferSelect;
