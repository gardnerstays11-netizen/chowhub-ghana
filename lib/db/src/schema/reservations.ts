import { pgTable, text, uuid, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { listingsTable } from "./listings";
import { usersTable } from "./users";

export const reservationsTable = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  partySize: integer("party_size").notNull(),
  occasion: text("occasion"),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({ id: true, createdAt: true, status: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
