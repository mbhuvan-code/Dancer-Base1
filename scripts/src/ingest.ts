/**
 * Standalone ingestion runner.
 * Run with:  pnpm --filter @workspace/scripts run ingest
 *
 * Runs all studio adapters and upserts the results into Postgres.
 * Safe to run repeatedly — classes are deduped on (studio, instructor, date, start_time).
 */
import { runPipeline } from "./pipeline";

console.log("⚙️  Running ingestion pipeline...\n");

runPipeline()
  .then(() => {
    console.log("\n✅  Ingestion complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌  Ingestion failed:", err);
    process.exit(1);
  });
