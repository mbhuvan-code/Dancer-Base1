import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, pastClassesTable, pastClassAttendeesTable, classesTable, instructorsTable, studiosTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { getOrCreateUser, getBadge } from "../lib/userHelper";

const router = Router();

router.get("/past-classes", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.json([]);

  const pastRows = await db.select({
    pastClass: pastClassesTable,
    class: classesTable,
    instructor: instructorsTable,
    studio: studiosTable,
  }).from(pastClassesTable)
    .innerJoin(classesTable, eq(pastClassesTable.classId, classesTable.id))
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .where(eq(pastClassesTable.userId, user.id));

  const result = await Promise.all(pastRows.map(async row => {
    const attendeeRows = await db.select({ userId: pastClassAttendeesTable.userId })
      .from(pastClassAttendeesTable)
      .where(eq(pastClassAttendeesTable.pastClassId, row.pastClass.id));

    let attendees: { id: number; name: string; username: string; profilePic: string | null; classesAttended: number; badge: string }[] = [];
    if (attendeeRows.length > 0) {
      const ids = attendeeRows.map(a => a.userId);
      const users = await db.select().from(usersTable).where(or(...ids.map(id => eq(usersTable.id, id))));
      attendees = users.map(u => ({ ...u, badge: getBadge(u.classesAttended) }));
    }

    return {
      id: row.pastClass.id,
      classId: row.pastClass.classId,
      songPlayed: row.pastClass.songPlayed,
      videoLinks: row.pastClass.videoLinks ?? [],
      attendeeCount: attendeeRows.length,
      attendees,
      attendedAt: row.pastClass.attendedAt,
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
    };
  }));

  return res.json(result);
});

export default router;
