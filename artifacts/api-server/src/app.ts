import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev tunnels (e.g. GitHub Codespaces port forwarding) strip the
// Authorization header. The frontend duplicates the Clerk token in
// x-auth-token — restore it here so clerkMiddleware can authenticate.
app.use((req, _res, next) => {
  const fallbackToken = req.headers["x-auth-token"];
  if (!req.headers.authorization && typeof fallbackToken === "string" && fallbackToken) {
    req.headers.authorization = `Bearer ${fallbackToken}`;
  }
  // Debug: show which auth inputs each API request carries
  if (req.path.startsWith("/api/") && req.path !== "/api/healthz") {
    logger.info(
      {
        path: req.path,
        method: req.method,
        hasAuthorization: Boolean(req.headers.authorization),
        hasXAuthToken: Boolean(fallbackToken),
        hasSessionCookie: Boolean(req.headers.cookie?.includes("__session")),
      },
      "auth inputs",
    );
  }
  next();
});

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
    // Debug: prints the reason auth fails (expired, wrong instance, etc.)
    debug: process.env.NODE_ENV !== "production",
  }))
);

app.use("/api", router);

export default app;
