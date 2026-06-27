import { Router } from "express";
import { db, studiosTable, classesTable, instructorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/studios/:studioId", async (req, res) => {
  const studioId = parseInt(req.params.studioId);
  const studio = await db.select().from(studiosTable).where(eq(studiosTable.id, studioId)).limit(1);
  if (!studio.length) return res.status(404).json({ error: "Studio not found" });

  const classes = await db
    .select({
      id: classesTable.id,
      instructorId: classesTable.instructorId,
      studioId: classesTable.studioId,
      date: classesTable.date,
      dayOfWeek: classesTable.dayOfWeek,
      startTime: classesTable.startTime,
      endTime: classesTable.endTime,
      price: classesTable.price,
      style: classesTable.style,
      level: classesTable.level,
      totalSpots: classesTable.totalSpots,
      spotsRemaining: classesTable.spotsRemaining,
      instructorName: instructorsTable.name,
      instructorPic: instructorsTable.profilePic,
    })
    .from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(eq(classesTable.studioId, studioId))
    .limit(20);

  return res.json({
    ...studio[0],
    upcomingClasses: classes.map(c => ({
      ...c,
      studioName: studio[0].displayName,
      studioAddress: studio[0].address,
      city: studio[0].city,
      state: studio[0].state,
      price: parseFloat(c.price as string),
      friendsAttending: [],
      isBooked: false,
      isSaved: false,
    })),
  });
});

export default router;
