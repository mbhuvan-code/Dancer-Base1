/**
 * Ingestion pipeline — runs all studio adapters, upserts class data into
 * Postgres, and logs each run to ingestion_runs.
 *
 * Run standalone:  pnpm --filter @workspace/scripts run ingest
 * Called by seed:  import { runPipeline } from "./pipeline"
 */
import {
  db,
  studiosTable,
  instructorsTable,
  classesTable,
  ingestionRunsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { cityDanceAdapter } from "./adapters/cityDance";
import { inTheGrooveAdapter } from "./adapters/inTheGroove";
import { onOneAdapter } from "./adapters/onOne";
import { fullOutAdapter } from "./adapters/fullOut";

export interface StudioInfo {
  /** Stable identifier used by NormalizedClass.studioKey */
  key: string;
  displayName: string;
  address: string;
  city: string;
  state: string;
}

export interface NormalizedClass {
  /** Must match a key in the adapter's studios array */
  studioKey: string;
  instructorName: string;
  instructorStyles: string[];
  instructorBio?: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  price: number;
  style: string;
  level: string;
  totalSpots: number;
  spotsRemaining: number;
  bookingUrl: string;
}

/**
 * An adapter may serve multiple physical rooms/locations (e.g. City Dance has
 * 60 Brady Studio A, 60 Brady Studio B, The Annex Downstairs, The Annex Upstairs).
 * Each is a separate `studios` entry; NormalizedClass.studioKey selects which one.
 */
export interface StudioAdapter {
  /** Human-readable label used in ingestion_runs log entries */
  name: string;
  studios: StudioInfo[];
  fetchClasses: () => Promise<NormalizedClass[]>;
}

const ADAPTERS: StudioAdapter[] = [
  cityDanceAdapter,
  inTheGrooveAdapter,
  onOneAdapter,
  fullOutAdapter,
];

async function upsertStudio(info: StudioInfo): Promise<number> {
  const existing = await db
    .select({ id: studiosTable.id })
    .from(studiosTable)
    .where(eq(studiosTable.displayName, info.displayName))
    .limit(1);
  if (existing.length) return existing[0].id;

  const [row] = await db
    .insert(studiosTable)
    .values({ displayName: info.displayName, address: info.address, city: info.city, state: info.state })
    .returning({ id: studiosTable.id });
  return row.id;
}

async function upsertInstructor(name: string, styles: string[], bio?: string): Promise<number> {
  const existing = await db
    .select({ id: instructorsTable.id })
    .from(instructorsTable)
    .where(eq(instructorsTable.name, name))
    .limit(1);
  if (existing.length) return existing[0].id;

  const [row] = await db
    .insert(instructorsTable)
    .values({ name, styles, bio: bio ?? null, profilePic: null })
    .returning({ id: instructorsTable.id });
  return row.id;
}

export async function runPipeline(adapters: StudioAdapter[] = ADAPTERS): Promise<void> {
  for (const adapter of adapters) {
    let classesIngested = 0;
    let runError: string | undefined;

    try {
      console.log(`  [pipeline] Running adapter: ${adapter.name}`);

      // Upsert all studios this adapter serves, build key→id map
      const studioIdByKey = new Map<string, number>();
      for (const studioInfo of adapter.studios) {
        studioIdByKey.set(studioInfo.key, await upsertStudio(studioInfo));
      }

      const classes = await adapter.fetchClasses();

      for (const c of classes) {
        const studioId = studioIdByKey.get(c.studioKey);
        if (studioId === undefined) {
          throw new Error(`Unknown studioKey "${c.studioKey}" returned by adapter ${adapter.name}`);
        }

        const instructorId = await upsertInstructor(c.instructorName, c.instructorStyles, c.instructorBio);

        await db
          .insert(classesTable)
          .values({
            studioId,
            instructorId,
            date: c.date,
            dayOfWeek: c.dayOfWeek,
            startTime: c.startTime,
            endTime: c.endTime,
            price: String(c.price),
            style: c.style,
            level: c.level,
            totalSpots: c.totalSpots,
            spotsRemaining: c.spotsRemaining,
            bookingUrl: c.bookingUrl,
          })
          .onConflictDoUpdate({
            target: [classesTable.studioId, classesTable.instructorId, classesTable.date, classesTable.startTime],
            set: {
              endTime: c.endTime,
              price: String(c.price),
              style: c.style,
              level: c.level,
              totalSpots: c.totalSpots,
              spotsRemaining: c.spotsRemaining,
              bookingUrl: c.bookingUrl,
            },
          });

        classesIngested++;
      }

      console.log(`  [pipeline] ✓ ${adapter.name}: ${classesIngested} classes`);
    } catch (err) {
      runError = String(err);
      console.error(`  [pipeline] ✗ ${adapter.name}: ${runError}`);
    }

    await db.insert(ingestionRunsTable).values({
      studio: adapter.name,
      classesIngested,
      status: runError ? "error" : "success",
      error: runError ?? null,
    });
  }
}
