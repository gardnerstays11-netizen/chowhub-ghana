import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const pushTokensTable = pgTable("push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  token: text("token").notNull(),
  platform: text("platform").notNull().default("unknown"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PushToken = typeof pushTokensTable.$inferSelect;
