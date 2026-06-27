import { pgTable, text, serial, integer, numeric, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { instructorsTable } from "./instructors";
import { studiosTable } from "./studios";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").notNull().references(() => instructorsTable.id),
  studioId: integer("studio_id").notNull().references(() => studiosTable.id),
  date: date("date", { mode: "string" }).notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  style: text("style").notNull(),
  level: text("level").notNull(),
  totalSpots: integer("total_spots").notNull().default(40),
  spotsRemaining: integer("spots_remaining").notNull().default(40),
  bookingUrl: text("booking_url"),
}, (table) => ({
  uniqueClass: unique("classes_studio_instructor_date_time_unique").on(
    table.studioId, table.instructorId, table.date, table.startTime
  ),
}));

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type DanceClass = typeof classesTable.$inferSelect;
