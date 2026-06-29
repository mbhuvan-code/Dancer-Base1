import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, friendsTable, feedItemsTable, classesTable, instructorsTable, studiosTable } from "@workspace/db";
import { eq, or, desc, SQL } from "drizzle-orm";
import { getOrCreateUser, getBadge } from "../lib/userHelper";

const router = Router();

router.get("/feed", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.json([]);

  const friendRows = await db.select({ friendId: friendsTable.friendId }).from(friendsTable).where(eq(friendsTable.userId, user.id));
  const friendIds = friendRows.map(r => r.friendId);

  // When user has no friends yet, show all activity as a discovery feed
  const whereClause: SQL | undefined = friendIds.length > 0
    ? or(...friendIds.map(id => eq(feedItemsTable.userId, id)))
    : undefined;

  const items = await db.select({
    feedItem: feedItemsTable,
    user: usersTable,
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(feedItemsTable)
    .innerJoin(usersTable, eq(feedItemsTable.userId, usersTable.id))
    .innerJoin(classesTable, eq(feedItemsTable.classId, classesTable.id))
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .where(whereClause)
    .orderBy(desc(feedItemsTable.createdAt))
    .limit(50);

  return res.json(items.map(row => ({
    id: row.feedItem.id,
    type: row.feedItem.type,
    createdAt: row.feedItem.createdAt,
    user: { ...row.user, badge: getBadge(row.user.classesAttended) },
    class: {
      id: row.class.id,
      instructorId: row.class.instructorId,
      instructorName: row.instructor.name,
      instructorPic: row.instructor.profilePic,
      studioId: row.class.studioId,
      studioName: row.studio.displayName,
      studioAddress: row.studio.address,
      city: row.studio.city,
      state: row.studio.state,
      date: row.class.date,
      dayOfWeek: row.class.dayOfWeek,
      startTime: row.class.startTime,
      endTime: row.class.endTime,
      price: parseFloat(row.class.price as string),
      style: row.class.style,
      level: row.class.level,
      totalSpots: row.class.totalSpots,
      spotsRemaining: row.class.spotsRemaining,
      friendsAttending: [],
      isBooked: false,
      isSaved: false,
    },
  })));
});

export default router;
