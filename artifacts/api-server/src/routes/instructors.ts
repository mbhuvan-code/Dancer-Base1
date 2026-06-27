import { Router } from "express";
import { db, instructorsTable, classesTable, studiosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/instructors/:instructorId", async (req, res) => {
  const instructorId = parseInt(req.params.instructorId);
  const instructor = await db.select().from(instructorsTable).where(eq(instructorsTable.id, instructorId)).limit(1);
  if (!instructor.length) return res.status(404).json({ error: "Instructor not found" });

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
      studioName: studiosTable.displayName,
      studioAddress: studiosTable.address,
      city: studiosTable.city,
      state: studiosTable.state,
    })
    .from(classesTable)
    .innerJoin(studiosTable, eq(classesTable.studioId, studiosTable.id))
    .where(eq(classesTable.instructorId, instructorId))
    .limit(20);

  return res.json({
    ...instructor[0],
    styles: instructor[0].styles ?? [],
    upcomingClasses: classes.map(c => ({
      ...c,
      instructorName: instructor[0].name,
      instructorPic: instructor[0].profilePic,
      price: parseFloat(c.price as string),
      friendsAttending: [],
      isBooked: false,
      isSaved: false,
    })),
  });
});

export default router;
