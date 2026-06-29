import { db, usersTable, friendsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";

export function getBadge(classesAttended: number): string {
  if (classesAttended >= 40) return "Legend";
  if (classesAttended >= 15) return "Hustler";
  if (classesAttended >= 5) return "Regular";
  return "Newcomer";
}

/** Always returns a user — creates one if this clerkId has never been seen. Auto-friends all existing users so feed populates immediately. */
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

  return newUser;
}
