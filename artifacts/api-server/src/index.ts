import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  // Debug: surface which Clerk instance this server verifies against
  logger.info(
    {
      secretKeyPrefix: (process.env.CLERK_SECRET_KEY ?? "MISSING").slice(0, 15),
      publishableKeyPrefix: (process.env.CLERK_PUBLISHABLE_KEY ?? "MISSING").slice(0, 25),
    },
    "Clerk config",
  );
});
