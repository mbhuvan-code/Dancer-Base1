import { db, usersTable, friendsTable, pastClassesTable, pastClassAttendeesTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";

/** Badge tiers by classes attended: Newcomer <10, Regular 10–24, Hustler 25–49, Legend 50+ */
export function getBadge(classesAttended: number): string {
  if (classesAttended >= 50) return "Legend";
  if (classesAttended >= 25) return "Hustler";
  if (classesAttended >= 10) return "Regular";
  return "Newcomer";
}

/**
 * Always returns a user — creates one if this clerkId has never been seen.
 * New users are auto-friended with all existing users (so the feed populates
 * immediately) and given demo class history so the profile isn't empty.
 */
export async function getOrCreateUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  const created = await db
    .insert(usersTable)
    .values({
      clerkId,
      name: "New Dancer",
      username: `dancer_${clerkId.slice(-6)}`,
      profilePic: null,
      classesAttended: 27, // demo history → Hustler badge
    })
    .returning();
  const newUser = created[0];

  // Auto-friend all existing users so the feed is populated from day one
  const others = await db.select({ id: usersTable.id }).from(usersTable).where(ne(usersTable.id, newUser.id));
  if (others.length > 0) {
    await db.insert(friendsTable).values(
      others.flatMap(u => [
        { userId: newUser.id, friendId: u.id },
        { userId: u.id, friendId: newUser.id },
      ])
    ).onConflictDoNothing();
  }

  // Copy the seeded past classes onto the new user so Profile → Past Classes has content
  try {
    const demoPast = await db.select().from(pastClassesTable).limit(6);
    const seenClassIds = new Set<number>();
    for (const p of demoPast) {
      if (seenClassIds.has(p.classId)) continue;
      seenClassIds.add(p.classId);
      const inserted = await db.insert(pastClassesTable).values({
        userId: newUser.id,
        classId: p.classId,
        songPlayed: p.songPlayed,
        videoLinks: p.videoLinks,
      }).returning();
      const originalAttendees = await db.select().from(pastClassAttendeesTable)
        .where(eq(pastClassAttendeesTable.pastClassId, p.id));
      await db.insert(pastClassAttendeesTable).values([
        ...originalAttendees.map(a => ({ pastClassId: inserted[0].id, userId: a.userId })),
        { pastClassId: inserted[0].id, userId: newUser.id },
      ]);
    }
  } catch {
    // Demo history is best-effort — never block user creation
  }

  return newUser;
}
