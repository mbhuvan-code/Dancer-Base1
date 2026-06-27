# dancerBase — AI Context File

Mobile-first dance class booking and community platform. Users browse upcoming classes, book spots, save favorites, follow friends, and view their past-class history. React + Vite frontend, Express API, PostgreSQL + Drizzle ORM, Clerk auth.

---

## Run & Operate

| Command | What it does |
|---|---|
| `pnpm --filter @workspace/api-server run dev` | Start API (port from `$PORT`, default 8080) |
| `pnpm --filter @workspace/dancer-base run dev` | Start frontend (port from `$PORT`) |
| `pnpm --filter @workspace/scripts run seed` | Re-seed DB via ingestion pipeline + social layer |
| `pnpm --filter @workspace/scripts run ingest` | Run ingestion pipeline only (upserts class data) |
| `pnpm --filter @workspace/db run push` | Push Drizzle schema changes to DB (dev only) |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client hooks from OpenAPI spec |
| `pnpm run typecheck` | Full typecheck across all packages |

---

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 19, Vite, Wouter (routing), TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express 5, Drizzle ORM, PostgreSQL
- **Auth**: Clerk (`@clerk/express` server, `@clerk/react` client)
- **API contracts**: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas
- **Build**: esbuild (API), Vite (frontend)

---

## Repository Map

```
artifacts-monorepo/
├── artifacts/
│   ├── api-server/          Express API (served at /api/*)
│   │   └── src/
│   │       ├── app.ts       Express app setup (CORS, Clerk middleware, routes)
│   │       ├── index.ts     Server entry point
│   │       ├── lib/
│   │       │   ├── logger.ts       Pino logger singleton
│   │       │   └── userHelper.ts   getOrCreateUser() — auto-provisions DB users
│   │       ├── middlewares/
│   │       │   └── clerkProxyMiddleware.ts
│   │       └── routes/
│   │           ├── index.ts        Mounts all routers under /api
│   │           ├── users.ts        GET/PATCH /users/me
│   │           ├── classes.ts      GET /classes, /classes/trending, /classes/:id
│   │           ├── bookings.ts     GET/POST /bookings, GET /bookings/:id
│   │           ├── saved.ts        GET /saved, POST/DELETE /saved/:classId
│   │           ├── feed.ts         GET /feed
│   │           ├── friends.ts      GET /friends, POST/DELETE /friends/:userId
│   │           ├── instructors.ts  GET /instructors/:id
│   │           ├── studios.ts      GET /studios/:id
│   │           ├── pastClasses.ts  GET /past-classes
│   │           └── health.ts       GET /api/healthz
│   │
│   └── dancer-base/         React frontend (served at /)
│       └── src/
│           ├── App.tsx           Root: WouterRouter → ClerkProvider → QueryClientProvider
│           ├── router.tsx        All routes, HomeRedirect, AuthLayout, cache invalidator
│           ├── main.tsx          Vite entry
│           ├── index.css         Tailwind + custom vars
│           ├── config/
│           │   └── clerk.ts      Clerk publishable key, appearance, basePath helpers
│           ├── components/
│           │   ├── auth/
│           │   │   ├── SignInPage.tsx
│           │   │   └── SignUpPage.tsx
│           │   ├── layout/
│           │   │   ├── MobileLayout.tsx   Tab-bar shell (h-[100dvh], bottom nav, z-50)
│           │   │   └── DetailLayout.tsx   Back-nav shell for detail pages
│           │   ├── shared/
│           │   │   ├── ClassCard.tsx      Core class card (save, book, friends-attending)
│           │   │   └── UserAvatar.tsx     Avatar with initials fallback
│           │   └── ui/                   shadcn/ui components (curated subset)
│           ├── hooks/
│           │   ├── use-toast.ts
│           │   └── use-mobile.tsx
│           ├── lib/
│           │   ├── queryClient.ts
│           │   └── utils.ts
│           └── pages/
│               ├── Landing.tsx          Pre-auth landing page with logo
│               ├── Onboarding.tsx       Post-signup profile setup (file upload)
│               ├── Search.tsx           Browse + filter classes (city/style chips)
│               ├── Classes.tsx          Upcoming + saved tabs
│               ├── Feed.tsx             Social activity feed
│               ├── Profile.tsx          User profile + past classes + edit sheet
│               ├── Instructor.tsx       Instructor detail page
│               ├── Studio.tsx           Studio detail page
│               ├── Checkout.tsx         Booking flow
│               ├── Receipt.tsx          Booking confirmation
│               ├── Videos.tsx           Past-class video links
│               └── FriendsAttending.tsx Friends going to a class
│
├── lib/
│   ├── api-client-react/    Generated TanStack Query hooks + fetch client
│   │   └── src/
│   │       ├── custom-fetch.ts   Configurable fetch (baseUrl, auth token, error types)
│   │       ├── generated/api.ts  All hooks (useGetMe, useListClasses, useSaveClass, …)
│   │       └── index.ts          Barrel export
│   ├── api-spec/
│   │   └── openapi.yaml         Source-of-truth OpenAPI spec (edit here, then codegen)
│   ├── api-zod/             Generated Zod schemas (used in API routes for validation)
│   └── db/
│       ├── drizzle.config.ts
│       └── src/
│           ├── index.ts          Barrel: exports db client + all tables
│           └── schema/
│               ├── users.ts      users table
│               ├── studios.ts    studios table
│               ├── instructors.ts
│               ├── classes.ts
│               ├── bookings.ts   bookings + saved_classes
│               ├── pastClasses.ts past_classes + past_class_attendees + feed_items
│               └── index.ts      Re-exports all schema tables
│
└── scripts/
    └── src/
        └── seed.ts   Seeds studios/instructors/classes from spreadsheet data
```

---

## Database Schema (key tables)

| Table | Key columns |
|---|---|
| `users` | id, clerkId, name, username, profilePic (base64 ok), classesAttended |
| `studios` | id, displayName, address, city, state |
| `instructors` | id, name, profilePic, bio, styles[] |
| `classes` | id, instructorId, studioId, date, dayOfWeek, startTime, endTime, price, style, level, totalSpots, spotsRemaining |
| `bookings` | id, userId, classId, confirmationCode, bookedAt |
| `saved_classes` | userId, classId |
| `feed_items` | id, type (booking/save), userId, classId, createdAt |
| `past_classes` | id, classId, songPlayed, videoLinks[], attendeeCount |
| `past_class_attendees` | pastClassId, userId |
| `friends` | userId, friendId |

---

## Seeded Data (from spreadsheet)

**Studios (5)**
- 60 Brady — Studio A (SF)
- 60 Brady — Studio B (SF)
- The Annex — Downstairs (SF, 1420 Harrison)
- The Annex — Upstairs (SF, 1420 Harrison)
- Brickhouse NYC (Brooklyn)

**22 instructors / 22 classes** across Sun 6/21, Mon 6/22, Tue 6/23 — exact match to the provided spreadsheet.

---

## Key Architecture Decisions

1. **`getOrCreateUser` in all protected routes** — Clerk auth resolves a `clerkId`; DB user is auto-created on first API call so users never hit a 404 on sign-up.
2. **Profile photos stored as base64 data URLs** — No file storage service wired yet; images are compressed client-side to ~256×256 JPEG before storing in the `text` column.
3. **OpenAPI-first API** — Edit `lib/api-spec/openapi.yaml`, run codegen, get typed hooks. Never write fetch calls by hand.
4. **Proxy-aware routing** — All traffic goes through Replit's reverse proxy at `:80`. Frontend uses relative URLs; no CORS config needed for same-origin requests.
5. **`h-[100dvh]` on MobileLayout** — Container is exactly viewport height so the absolute-positioned tab bar never scrolls off screen.

---

## Gotchas

- `pnpm run dev` at workspace root doesn't work (no root dev script). Always use `--filter`.
- After editing `lib/api-spec/openapi.yaml`, run codegen AND restart the API server.
- Profile photos are base64 strings (~10–40 KB per image) stored in Postgres `text`. Fine for now; swap for object storage if performance degrades.
- The `seed.ts` script truncates studios/instructors/classes/bookings but **keeps users** — safe to re-run after user sign-ups.
- Never import from `attached_assets/` in web code; copy files to `public/` first.
