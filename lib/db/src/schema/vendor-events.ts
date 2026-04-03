import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { listingsTable } from "./listings";
import { vendorsTable } from "./vendors";

export const vendorEventsTable = pgTable("vendor_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listingsTable.id).notNull(),
  vendorId: uuid("vendor_id").references(() => vendorsTable.id).notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"),
  imageUrl: text("image_url"),
  category: text("category").default("general"),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
