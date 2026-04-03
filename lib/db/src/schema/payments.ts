import { pgTable, text, uuid, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vendorsTable } from "./vendors";

export const paymentsTable = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: text("reference").notNull().unique(),
  provider: text("provider").notNull().default("paystack"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("GHS"),
  status: text("status").notNull().default("pending"),
  paymentType: text("payment_type").notNull(),
  orderId: uuid("order_id"),
  subscriptionId: uuid("subscription_id"),
  userId: uuid("user_id").references(() => usersTable.id),
  vendorId: uuid("vendor_id").references(() => vendorsTable.id),
  email: text("email").notNull(),
  channel: text("channel"),
  metadata: text("metadata"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
