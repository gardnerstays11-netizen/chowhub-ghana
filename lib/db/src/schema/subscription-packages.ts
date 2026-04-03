import { pgTable, text, uuid, timestamp, boolean, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionPackagesTable = pgTable("subscription_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  price: real("price").notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  features: jsonb("features").notNull().default([]),
  maxPhotos: integer("max_photos").notNull().default(5),
  maxMenuItems: integer("max_menu_items").notNull().default(20),
  isFeaturedIncluded: boolean("is_featured_included").notNull().default(false),
  prioritySupport: boolean("priority_support").notNull().default(false),
  analyticsAccess: text("analytics_access").notNull().default("basic"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubscriptionPackageSchema = createInsertSchema(subscriptionPackagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriptionPackage = z.infer<typeof insertSubscriptionPackageSchema>;
export type SubscriptionPackage = typeof subscriptionPackagesTable.$inferSelect;
