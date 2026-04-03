import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { listingsTable } from "./listings";
import { usersTable } from "./users";

export const ordersTable = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  items: jsonb("items").notNull().default([]),
  orderType: text("order_type").notNull(),
  deliveryAddress: text("delivery_address"),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, status: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
