import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, friendsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { getOrCreateUser, getBadge } from "../lib/userHelper";

const router = Router();

router.get("/friends", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.json([]);

  const friendRows = await db
    .select({ friendId: friendsTable.friendId })
    .from(friendsTable)
    .where(eq(friendsTable.userId, user.id));

  if (!friendRows.length) return res.json([]);

  const friendIds = friendRows.map(r => r.friendId);
  const friends = await db.select().from(usersTable)
    .where(or(...friendIds.map(id => eq(usersTable.id, id))));

  return res.json(friends.map(f => ({ ...f, badge: getBadge(f.classesAttended) })));
});

router.post("/friends", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const target = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!target.length) return res.status(404).json({ error: "User not found" });
  if (target[0].id === user.id) return res.status(400).json({ error: "Cannot add yourself" });

  const existing = await db.select().from(friendsTable)
    .where(and(eq(friendsTable.userId, user.id), eq(friendsTable.friendId, target[0].id)));
  if (!existing.length) {
    await db.insert(friendsTable).values({ userId: user.id, friendId: target[0].id });
  }

  return res.json({ ...target[0], badge: getBadge(target[0].classesAttended) });
});

router.delete("/friends/:userId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const targetId = parseInt(req.params.userId);
  await db.delete(friendsTable)
    .where(and(eq(friendsTable.userId, user.id), eq(friendsTable.friendId, targetId)));

  return res.json({ success: true });
});

export default router;
