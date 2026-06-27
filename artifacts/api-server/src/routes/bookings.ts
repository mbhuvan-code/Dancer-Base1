import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, bookingsTable, classesTable, instructorsTable, studiosTable, feedItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getOrCreateUser } from "../lib/userHelper";

const router = Router();

async function buildBookingResponse(booking: typeof bookingsTable.$inferSelect) {
  const classRows = await db.select({
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .where(eq(classesTable.id, booking.classId))
    .limit(1);

  if (!classRows.length) return null;
  const r = classRows[0];
  return {
    id: booking.id,
    userId: booking.userId,
    classId: booking.classId,
    bookedAt: booking.bookedAt,
    confirmationCode: booking.confirmationCode,
    class: {
      id: r.class.id,
      instructorId: r.class.instructorId,
      instructorName: r.instructor.name,
      instructorPic: r.instructor.profilePic,
      studioId: r.class.studioId,
      studioName: r.studio.displayName,
      studioAddress: r.studio.address,
      city: r.studio.city,
      state: r.studio.state,
      date: r.class.date,
      dayOfWeek: r.class.dayOfWeek,
      startTime: r.class.startTime,
      endTime: r.class.endTime,
      price: parseFloat(r.class.price as string),
      style: r.class.style,
      level: r.class.level,
      totalSpots: r.class.totalSpots,
      spotsRemaining: r.class.spotsRemaining,
      friendsAttending: [],
      isBooked: true,
      bookingId: booking.id,
      isSaved: false,
      bookingUrl: r.class.bookingUrl ?? null,
    },
  };
}

router.get("/bookings", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.json([]);

  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, user.id));
  const results = await Promise.all(bookings.map(buildBookingResponse));
  return res.json(results.filter(Boolean));
});

router.post("/bookings", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { classId } = req.body;
  if (!classId) return res.status(400).json({ error: "classId required" });

  const existing = await db.select().from(bookingsTable)
    .where(and(eq(bookingsTable.userId, user.id), eq(bookingsTable.classId, classId)));
  if (existing.length) return res.status(400).json({ error: "Already booked" });

  const confirmationCode = `DB-${randomBytes(4).toString("hex").toUpperCase()}`;
  const [booking] = await db.insert(bookingsTable).values({
    userId: user.id,
    classId,
    confirmationCode,
  }).returning();

  await db.update(classesTable)
    .set({ spotsRemaining: db.$count(bookingsTable, eq(bookingsTable.classId, classId)) as unknown as number })
    .where(eq(classesTable.id, classId))
    .catch(() => {});

  await db.insert(feedItemsTable).values({ type: "booking", userId: user.id, classId }).catch(() => {});

  const result = await buildBookingResponse(booking);
  return res.status(201).json(result);
});

router.get("/bookings/:bookingId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const bookingId = parseInt(req.params.bookingId);
  const rows = await db.select().from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.userId, user.id)));
  if (!rows.length) return res.status(404).json({ error: "Booking not found" });

  const result = await buildBookingResponse(rows[0]);
  return res.json(result);
});

router.delete("/bookings/:bookingId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const bookingId = parseInt(req.params.bookingId);
  await db.delete(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.userId, user.id)));
  return res.json({ success: true });
});

export default router;
