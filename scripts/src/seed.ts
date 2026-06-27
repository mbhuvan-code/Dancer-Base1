/**
 * Seed script — populates the database through the ingestion pipeline, then
 * layers in demo users, friendships, bookings, saves, and past-class data.
 *
 * Run with:  pnpm --filter @workspace/scripts run seed
 *
 * Safe to re-run: truncates class-related tables first, keeps real users intact.
 */
import {
  db,
  usersTable,
  classesTable,
  bookingsTable,
  savedClassesTable,
  feedItemsTable,
  pastClassesTable,
  pastClassAttendeesTable,
  friendsTable,
  studiosTable,
  instructorsTable,
  ingestionRunsTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { runPipeline } from "./pipeline";

// ---------------------------------------------------------------------------
// Demo users
// ---------------------------------------------------------------------------
const DEMO_USERS = [
  { clerkId: "demo_alex_chen",       name: "Alex Chen",       username: "alex_c",    classesAttended: 3  },
  { clerkId: "demo_maya_patel",      name: "Maya Patel",      username: "maya_p",    classesAttended: 12 },
  { clerkId: "demo_jordan_lee",      name: "Jordan Lee",      username: "jordan_l",  classesAttended: 27 },
  { clerkId: "demo_sam_rodriguez",   name: "Sam Rodriguez",   username: "sam_r",     classesAttended: 8  },
  { clerkId: "demo_casey_kim",       name: "Casey Kim",       username: "casey_k",   classesAttended: 1  },
  { clerkId: "demo_river_johnson",   name: "River Johnson",   username: "river_j",   classesAttended: 41 },
] as const;

// ---------------------------------------------------------------------------
// Past-class flavour data (songs + video links)
// ---------------------------------------------------------------------------
const PAST_CLASS_FLAVOUR = [
  { song: "Not Like Us – Kendrick Lamar",       video: "https://www.youtube.com/shorts/example1" },
  { song: "MAGNETIC – ILLIT",                   video: "https://www.youtube.com/shorts/example2" },
  { song: "Good as Hell – Lizzo",               video: "https://www.youtube.com/shorts/example3" },
  { song: "Essence – Wizkid ft. Tems",          video: "https://www.youtube.com/shorts/example4" },
  { song: "Easy On Me – Adele (remix)",          video: "https://www.youtube.com/shorts/example5" },
  { song: "Peaches – Justin Bieber",             video: "https://www.youtube.com/shorts/example6" },
];

function confirmationCode() {
  return `DB-${randomBytes(4).toString("hex").toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  console.log("🌱  Seeding dancerBase database...\n");

  // 1. Clear class-dependent data (keep real users)
  console.log("  Clearing old class data...");
  await db.execute(
    sql`TRUNCATE ingestion_runs, past_class_attendees, past_classes, feed_items, saved_classes, bookings, classes, instructors, studios RESTART IDENTITY CASCADE`
  );
  console.log("  ✓ Cleared\n");

  // 2. Upsert demo users (skips if clerkId already exists)
  console.log("  Upserting demo users...");
  const insertedUsers: { id: number; name: string }[] = [];
  for (const u of DEMO_USERS) {
    const [row] = await db
      .insert(usersTable)
      .values({ ...u, profilePic: null })
      .onConflictDoNothing()
      .returning({ id: usersTable.id, name: usersTable.name });
    if (row) insertedUsers.push(row);
  }
  // Also fetch any that already existed
  const allDemoUsers = await db
    .select({ id: usersTable.id, name: usersTable.name, clerkId: usersTable.clerkId })
    .from(usersTable)
    .where(sql`clerk_id LIKE 'demo_%'`);
  console.log(`  ✓ ${allDemoUsers.length} demo users\n`);

  // 3. Run the ingestion pipeline (populates studios, instructors, classes)
  console.log("  Running ingestion pipeline...");
  await runPipeline();
  console.log();

  // 4. Pull all inserted classes for reference
  const allClasses = await db.select({ id: classesTable.id, date: classesTable.date }).from(classesTable);
  console.log(`  ✓ ${allClasses.length} classes from pipeline\n`);

  if (allClasses.length === 0 || allDemoUsers.length === 0) {
    console.log("  ⚠️  No classes or users — skipping social layer seed.");
    process.exit(0);
  }

  // Helper: pick n random items from array
  const pick = <T>(arr: T[], n: number): T[] =>
    [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));

  // 5. Wire up friendships (each user friends 2-3 others)
  console.log("  Seeding friendships...");
  const friendPairs: [number, number][] = [];
  for (const user of allDemoUsers) {
    const others = allDemoUsers.filter(u => u.id !== user.id);
    const friends = pick(others, 3);
    for (const friend of friends) {
      if (!friendPairs.some(([a, b]) => (a === user.id && b === friend.id) || (a === friend.id && b === user.id))) {
        friendPairs.push([user.id, friend.id]);
      }
    }
  }
  for (const [userId, friendId] of friendPairs) {
    await db.insert(friendsTable).values({ userId, friendId }).onConflictDoNothing();
    await db.insert(friendsTable).values({ userId: friendId, friendId: userId }).onConflictDoNothing();
  }
  console.log(`  ✓ ${friendPairs.length * 2} friendship edges\n`);

  // 6. Seed bookings (each demo user books 1-2 upcoming classes)
  console.log("  Seeding bookings...");
  const upcomingClasses = allClasses;
  let bookingCount = 0;
  const bookedPairs = new Set<string>();

  for (const user of allDemoUsers) {
    const toBook = pick(upcomingClasses, 2);
    for (const cls of toBook) {
      const key = `${user.id}-${cls.id}`;
      if (bookedPairs.has(key)) continue;
      bookedPairs.add(key);

      const [booking] = await db.insert(bookingsTable).values({
        userId: user.id,
        classId: cls.id,
        confirmationCode: confirmationCode(),
      }).returning({ id: bookingsTable.id });

      await db.insert(feedItemsTable).values({
        type: "booking",
        userId: user.id,
        classId: cls.id,
      }).catch(() => {});

      bookingCount++;
    }
  }
  console.log(`  ✓ ${bookingCount} bookings\n`);

  // 7. Seed saved classes (each demo user saves 2-3 different classes)
  console.log("  Seeding saves...");
  let saveCount = 0;
  for (const user of allDemoUsers) {
    const toSave = pick(upcomingClasses, 3);
    for (const cls of toSave) {
      await db.insert(savedClassesTable).values({ userId: user.id, classId: cls.id }).onConflictDoNothing();
      await db.insert(feedItemsTable).values({
        type: "save",
        userId: user.id,
        classId: cls.id,
      }).catch(() => {});
      saveCount++;
    }
  }
  console.log(`  ✓ ${saveCount} saves\n`);

  // 8. Seed past classes using the first few classes as historical stubs
  console.log("  Seeding past classes...");
  const pastStubs = pick(upcomingClasses, 6);
  let pastCount = 0;
  for (let i = 0; i < pastStubs.length; i++) {
    const cls = pastStubs[i];
    const flavour = PAST_CLASS_FLAVOUR[i % PAST_CLASS_FLAVOUR.length];
    const attendees = pick(allDemoUsers, 3);

    const [pastClass] = await db.insert(pastClassesTable).values({
      userId: attendees[0].id,
      classId: cls.id,
      songPlayed: flavour.song,
      videoLinks: [flavour.video],
    }).returning({ id: pastClassesTable.id });

    for (const attendee of attendees) {
      await db.insert(pastClassAttendeesTable).values({
        pastClassId: pastClass.id,
        userId: attendee.id,
      }).onConflictDoNothing();
    }
    pastCount++;
  }
  console.log(`  ✓ ${pastCount} past class records\n`);

  // Summary
  const [studioCount] = await db.select({ count: sql<number>`count(*)` }).from(studiosTable);
  const [instructorCount] = await db.select({ count: sql<number>`count(*)` }).from(instructorsTable);
  const [classCount] = await db.select({ count: sql<number>`count(*)` }).from(classesTable);

  console.log("✅  Seed complete!\n");
  console.log(`  Studios:     ${studioCount.count}`);
  console.log(`  Instructors: ${instructorCount.count}`);
  console.log(`  Classes:     ${classCount.count}`);
  console.log(`  Demo users:  ${allDemoUsers.length}`);
  console.log(`  Bookings:    ${bookingCount}`);
  console.log(`  Saves:       ${saveCount}`);
  console.log(`  Past classes: ${pastCount}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
