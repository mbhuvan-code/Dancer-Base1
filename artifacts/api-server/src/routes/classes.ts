import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, classesTable, instructorsTable, studiosTable, bookingsTable, savedClassesTable, friendsTable } from "@workspace/db";
import { eq, and, or, asc, ilike, sql } from "drizzle-orm";
import { getOrCreateUser, getBadge } from "../lib/userHelper";

const router = Router();

async function buildClassCard(
  classRow: typeof classesTable.$inferSelect,
  instructor: { name: string; profilePic: string | null },
  studio: typeof studiosTable.$inferSelect,
  userId?: number
) {
  let friendsAttending: { id: number; name: string; username: string; profilePic: string | null; classesAttended: number; badge: string }[] = [];
  let isBooked = false;
  let bookingId: number | null = null;
  let isSaved = false;

  if (userId) {
    const friendRows = await db.select({ friendId: friendsTable.friendId }).from(friendsTable).where(eq(friendsTable.userId, userId));
    const friendIds = friendRows.map(r => r.friendId);
    if (friendIds.length > 0) {
      const bookingRows = await db.select({ userId: bookingsTable.userId }).from(bookingsTable)
        .where(and(eq(bookingsTable.classId, classRow.id), or(...friendIds.map(id => eq(bookingsTable.userId, id)))));
      if (bookingRows.length > 0) {
        const attendingIds = bookingRows.map(b => b.userId);
        const attendingUsers = await db.select().from(usersTable).where(or(...attendingIds.map(id => eq(usersTable.id, id))));
        friendsAttending = attendingUsers.map(u => ({ ...u, badge: getBadge(u.classesAttended) }));
      }
    }
    const bookedRow = await db.select().from(bookingsTable).where(and(eq(bookingsTable.classId, classRow.id), eq(bookingsTable.userId, userId))).limit(1);
    isBooked = bookedRow.length > 0;
    bookingId = isBooked ? bookedRow[0].id : null;
    const savedRow = await db.select().from(savedClassesTable).where(and(eq(savedClassesTable.classId, classRow.id), eq(savedClassesTable.userId, userId))).limit(1);
    isSaved = savedRow.length > 0;
  }

  return {
    id: classRow.id,
    instructorId: classRow.instructorId,
    instructorName: instructor.name,
    instructorPic: instructor.profilePic,
    studioId: classRow.studioId,
    studioName: studio.displayName,
    studioAddress: studio.address,
    city: studio.city,
    state: studio.state,
    date: classRow.date,
    dayOfWeek: classRow.dayOfWeek,
    startTime: classRow.startTime,
    endTime: classRow.endTime,
    price: parseFloat(classRow.price as string),
    style: classRow.style,
    level: classRow.level,
    totalSpots: classRow.totalSpots,
    spotsRemaining: classRow.spotsRemaining,
    friendsAttending,
    isBooked,
    bookingId,
    isSaved,
    bookingUrl: classRow.bookingUrl ?? null,
  };
}

router.get("/classes/trending", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  const user = clerkId ? await getOrCreateUser(clerkId) : null;

  const classes = await db.select({
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .orderBy(asc(classesTable.spotsRemaining))
    .limit(30);

  const cards = await Promise.all(classes.map(r => buildClassCard(r.class, r.instructor, r.studio, user?.id)));
  // Booked classes live in the Classes tab, not in discovery
  return res.json(cards.filter(c => !c.isBooked));
});

router.get("/classes", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  const user = clerkId ? await getOrCreateUser(clerkId) : null;

  const { search, city, style, level, instructor: instructorFilter, dateFrom, dateTo, priceMin, priceMax } = req.query as Record<string, string>;

  let query = db.select({
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id));

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(instructorsTable.name, `%${search}%`),
        ilike(studiosTable.displayName, `%${search}%`),
        ilike(classesTable.style, `%${search}%`),
        ilike(studiosTable.city, `%${search}%`),
      )
    );
  }
  if (city) conditions.push(ilike(studiosTable.city, `%${city}%`));
  if (style) conditions.push(ilike(classesTable.style, `%${style}%`));
  if (level) conditions.push(ilike(classesTable.level, `%${level}%`));
  if (instructorFilter) conditions.push(ilike(instructorsTable.name, `%${instructorFilter}%`));
  if (dateFrom) conditions.push(sql`${classesTable.date} >= ${dateFrom}`);
  if (dateTo) conditions.push(sql`${classesTable.date} <= ${dateTo}`);
  if (priceMin) conditions.push(sql`${classesTable.price} >= ${parseFloat(priceMin)}`);
  if (priceMax) conditions.push(sql`${classesTable.price} <= ${parseFloat(priceMax)}`);

  const results = await (conditions.length > 0 ? query.where(and(...conditions as [ReturnType<typeof ilike>, ...ReturnType<typeof ilike>[]])) : query)
    .orderBy(asc(classesTable.spotsRemaining))
    .limit(50);

  const cards = await Promise.all(results.map(r => buildClassCard(r.class, r.instructor, r.studio, user?.id)));
  // Booked classes live in the Classes tab, not in discovery
  return res.json(cards.filter(c => !c.isBooked));
});

router.get("/classes/:classId/friends-attending", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.json([]);
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.json([]);

  const classId = parseInt(req.params.classId);
  const friendRows = await db.select({ friendId: friendsTable.friendId }).from(friendsTable).where(eq(friendsTable.userId, user.id));
  const friendIds = friendRows.map(r => r.friendId);
  if (!friendIds.length) return res.json([]);

  const bookingRows = await db.select({ userId: bookingsTable.userId }).from(bookingsTable)
    .where(and(eq(bookingsTable.classId, classId), or(...friendIds.map(id => eq(bookingsTable.userId, id)))));

  if (!bookingRows.length) return res.json([]);
  const attendingIds = bookingRows.map(b => b.userId);
  const users = await db.select().from(usersTable).where(or(...attendingIds.map(id => eq(usersTable.id, id))));
  return res.json(users.map(u => ({ ...u, badge: getBadge(u.classesAttended) })));
});

router.get("/classes/:classId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  const user = clerkId ? await getOrCreateUser(clerkId) : null;

  const classId = parseInt(req.params.classId);
  const rows = await db.select({
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .where(eq(classesTable.id, classId))
    .limit(1);

  if (!rows.length) return res.status(404).json({ error: "Class not found" });
  const card = await buildClassCard(rows[0].class, rows[0].instructor, rows[0].studio, user?.id);
  return res.json(card);
});

export default router;
