import { pgTable, text, uuid, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const searchLogsTable = pgTable("search_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  query: text("query").notNull().default(""),
  city: text("city"),
  category: text("category"),
  filters: jsonb("filters").default({}).notNull(),
  resultsCount: integer("results_count").notNull().default(0),
  userId: uuid("user_id").references(() => usersTable.id),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
