import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function getBadge(classesAttended: number): string {
  if (classesAttended >= 40) return "Legend";
  if (classesAttended >= 15) return "Hustler";
  if (classesAttended >= 5) return "Regular";
  return "Newcomer";
}

/** Always returns a user — creates one if this clerkId has never been seen. */
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
      classesAttended: 0,
    })
    .returning();
  return created[0];
}
