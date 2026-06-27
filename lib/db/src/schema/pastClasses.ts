import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { classesTable } from "./classes";

export const pastClassesTable = pgTable("past_classes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  classId: integer("class_id").notNull().references(() => classesTable.id),
  songPlayed: text("song_played"),
  videoLinks: text("video_links").array(),
  attendedAt: timestamp("attended_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPastClassSchema = createInsertSchema(pastClassesTable).omit({ id: true, attendedAt: true });
export type InsertPastClass = z.infer<typeof insertPastClassSchema>;
export type PastClass = typeof pastClassesTable.$inferSelect;

export const pastClassAttendeesTable = pgTable("past_class_attendees", {
  id: serial("id").primaryKey(),
  pastClassId: integer("past_class_id").notNull().references(() => pastClassesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
});

export type PastClassAttendee = typeof pastClassAttendeesTable.$inferSelect;

export const feedItemsTable = pgTable("feed_items", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  classId: integer("class_id").notNull().references(() => classesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedItemSchema = createInsertSchema(feedItemsTable).omit({ id: true, createdAt: true });
export type InsertFeedItem = z.infer<typeof insertFeedItemSchema>;
export type FeedItem = typeof feedItemsTable.$inferSelect;
