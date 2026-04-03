import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vendorsTable = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessName: text("business_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  status: text("status").notNull().default("pending"),
  plan: text("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendorsTable).omit({ id: true, createdAt: true, status: true, plan: true, planExpiresAt: true });
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendorsTable.$inferSelect;
