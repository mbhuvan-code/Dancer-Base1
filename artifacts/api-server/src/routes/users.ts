import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, friendsTable } from "@workspace/db";
import { eq, or, ilike, notInArray, and } from "drizzle-orm";

const router = Router();

function getBadge(classesAttended: number): string {
  if (classesAttended >= 40) return "Legend";
  if (classesAttended >= 15) return "Hustler";
  if (classesAttended >= 5) return "Regular";
  return "Newcomer";
}

async function getOrCreateUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];
  const created = await db.insert(usersTable).values({
    clerkId,
    name: "New Dancer",
    username: `dancer_${clerkId.slice(-6)}`,
    profilePic: null,
    classesAttended: 0,
  }).returning();
  return created[0];
}

router.get("/users/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  return res.json({ ...user, badge: getBadge(user.classesAttended) });
});

router.patch("/users/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const { name, username, profilePic } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (username) updates.username = username;
  if (profilePic !== undefined) updates.profilePic = profilePic;
  const updated = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  return res.json({ ...updated[0], badge: getBadge(updated[0].classesAttended) });
});

router.get("/users/search", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const q = ((req.query.q as string) || "").trim();

  const friendRows = await db.select({ friendId: friendsTable.friendId }).from(friendsTable).where(eq(friendsTable.userId, user.id));
  const excludeIds = [user.id, ...friendRows.map(r => r.friendId)];

  const baseCondition = notInArray(usersTable.id, excludeIds);
  const searchCondition = q ? and(baseCondition, or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.username, `%${q}%`))) : baseCondition;

  const users = await db.select().from(usersTable).where(searchCondition).limit(20);
  return res.json(users.map(u => ({ ...u, badge: getBadge(u.classesAttended) })));
});

router.get("/users/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user.length) return res.status(404).json({ error: "User not found" });
  return res.json({ ...user[0], badge: getBadge(user[0].classesAttended) });
});

export default router;
