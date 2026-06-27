import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, savedClassesTable, classesTable, instructorsTable, studiosTable, friendsTable, bookingsTable, feedItemsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { getOrCreateUser, getBadge } from "../lib/userHelper";

const router = Router();

async function buildClassCard(classRow: typeof classesTable.$inferSelect, instructor: { name: string; profilePic: string | null }, studio: typeof studiosTable.$inferSelect, userId: number) {
  const friendRows = await db.select({ friendId: friendsTable.friendId }).from(friendsTable).where(eq(friendsTable.userId, userId));
  const friendIds = friendRows.map(r => r.friendId);
  let friendsAttending: { id: number; name: string; username: string; profilePic: string | null; classesAttended: number; badge: string }[] = [];
  if (friendIds.length > 0) {
    const bookingRows = await db.select({ userId: bookingsTable.userId }).from(bookingsTable)
      .where(and(eq(bookingsTable.classId, classRow.id), or(...friendIds.map(id => eq(bookingsTable.userId, id)))));
    if (bookingRows.length > 0) {
      const attendingIds = bookingRows.map(b => b.userId);
      const attendingUsers = await db.select().from(usersTable).where(or(...attendingIds.map(id => eq(usersTable.id, id))));
      friendsAttending = attendingUsers.map(u => ({ ...u, badge: getBadge(u.classesAttended) }));
    }
  }
  const savedRow = await db.select().from(savedClassesTable).where(and(eq(savedClassesTable.classId, classRow.id), eq(savedClassesTable.userId, userId))).limit(1);
  const bookedRow = await db.select().from(bookingsTable).where(and(eq(bookingsTable.classId, classRow.id), eq(bookingsTable.userId, userId))).limit(1);
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
    isBooked: bookedRow.length > 0,
    isSaved: savedRow.length > 0,
  };
}

router.get("/saved", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.json([]);

  const savedRows = await db.select().from(savedClassesTable).where(eq(savedClassesTable.userId, user.id));
  if (!savedRows.length) return res.json([]);

  const classIds = savedRows.map(r => r.classId);
  const classes = await db.select({
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .where(or(...classIds.map(id => eq(classesTable.id, id))));

  const cards = await Promise.all(classes.map(r => buildClassCard(r.class, r.instructor, r.studio, user.id)));
  return res.json(cards);
});

router.post("/saved/:classId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const classId = parseInt(req.params.classId);
  const existing = await db.select().from(savedClassesTable)
    .where(and(eq(savedClassesTable.userId, user.id), eq(savedClassesTable.classId, classId)));
  if (!existing.length) {
    await db.insert(savedClassesTable).values({ userId: user.id, classId });
    await db.insert(feedItemsTable).values({ type: "saved", userId: user.id, classId }).catch(() => {});
  }
  return res.json({ success: true });
});

router.delete("/saved/:classId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const classId = parseInt(req.params.classId);
  await db.delete(savedClassesTable)
    .where(and(eq(savedClassesTable.userId, user.id), eq(savedClassesTable.classId, classId)));
  return res.json({ success: true });
});

export default router;
