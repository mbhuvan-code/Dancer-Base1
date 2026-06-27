import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const ingestionRunsTable = pgTable("ingestion_runs", {
  id: serial("id").primaryKey(),
  studio: text("studio").notNull(),
  ranAt: timestamp("ran_at", { withTimezone: true }).notNull().defaultNow(),
  classesIngested: integer("classes_ingested").notNull().default(0),
  status: text("status").notNull().default("success"),
  error: text("error"),
});

export type IngestionRun = typeof ingestionRunsTable.$inferSelect;
