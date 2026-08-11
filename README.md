# Multi-Tenant Quote Builder

Contractors build quotes for their customers; quotes contain sections; sections contain line items. NestJS + TypeORM/SQLite backend, React + Vite frontend, TypeScript throughout.

## Run it

Requires Node 20+ (developed/tested on Node 26.5.0) and npm.

```bash
npm install --prefix backend
npm install --prefix frontend
npm install            # root deps (just `concurrently`, to run both apps with one command)
npm run seed            # creates backend/data/dev.sqlite3 and seeds 2 orgs / 4 users / 4 quotes
npm run dev              # runs backend (:3000) and frontend (:5173) together
```

Open http://localhost:5173. The header has a "Logged in as" switcher standing in for a login screen — pick any seeded user to see their organization's quotes. `npm run seed` prints each seeded user's id/email if you want to hit the API directly:

```bash
curl -H "X-User-Id: <a seeded user id>" http://localhost:3000/quotes
```

Re-running `npm run seed` wipes and recreates the SQLite file — if the backend is already running, restart it afterward (it holds an open handle to the old file).

Backend tests: `npm test --prefix backend` (10 tests: totals math against the spec's worked example plus discount edge cases, and an integration suite that exercises cross-org 404s directly through the service layer).

### Or run it with Docker

```bash
docker compose up --build
```

That's the whole thing — no local Node install needed. On first run the backend seeds itself automatically (its container entrypoint seeds only if `data/dev.sqlite3` doesn't exist yet, so restarting the stack doesn't wipe your data). Same two ports: http://localhost:5173 for the app, http://localhost:3000 for the API directly.

One thing worth knowing if you go poking at `frontend/Dockerfile`: Vite bakes `VITE_API_URL` into the JS bundle at build time. It has to be an address the *browser* can reach, not a Docker-internal hostname — the built frontend is static files served to your browser, which then calls the API directly, not through the frontend container. `docker-compose.yml` sets it to `http://localhost:3000`, which works because the backend's port is published to the host.

To force a reseed under Docker: `docker compose down -v` (drops the named volume) then `docker compose up --build` again.

## Assumptions

- **`X-User-Id` is the entire auth model**, as specified. A `TenantGuard` resolves it to a user + `organizationId` on every request; missing or unknown → 401. Every query is scoped by that `organizationId`.
- **Cross-tenant access returns 404, not 403.** Reading or editing another org's quote id looks identical to that id not existing, so the API never confirms a resource exists in an org you can't see.
- **Added `GET /users`, unguarded, not in the spec.** With no login flow, the frontend has no way to know which ids exist to offer as a "log in as" switcher. This endpoint stands in for a directory/SSO picker — it returns only `id/name/email/organization`, never quote data, so it doesn't weaken tenant isolation.
- **`PATCH /quotes/:id` takes the full `sections`/`lineItems` arrays** and reconciles add/edit/remove server-side by diffing on `id` (rows without an `id` are new, rows present in the DB but missing from the payload are deleted). This was simpler than separate line-item endpoints and matches how the editor actually saves — the whole form, debounced.
- **Discount is applied to the subtotal-after-markup, before tax**; a percentage discount is a percent of that subtotal, a fixed discount is a dollar amount clamped to `[0, subtotal]` so it can never push the total negative. The spec's worked example (no discount) checks out exactly: $250 → $275 after 10% markup → $297.00 after 8% tax.
- **Money is stored as floats**, not integer cents, given the SQLite/in-memory, time-boxed scope of this exercise. Every total is rounded to cents only at the output boundary (server response and client display) so intermediate math doesn't drift. Flagged in "what I'd do next" — integer cents is the correct fix.
- **The React editor computes totals client-side**, using a function that intentionally mirrors `backend/src/quotes/totals.ts` line-for-line (`frontend/src/totals.ts`), so what the user sees while typing matches what the server will persist. This is why totals update with zero perceptible lag — it's not waiting on a round trip. Edits autosave via a debounced (~700ms) `PATCH`; a save indicator shows pending/saving/saved/error.
- **Sync is idempotent via stored state**, not a request-level idempotency key: `syncStatus` + `externalId` live on the quote. A quote that's already `synced` short-circuits and returns the cached result instead of calling the flaky external client again. Only `accepted` quotes can sync. This is sufficient for "safe to call more than once" as specified; it doesn't protect against two truly concurrent first-time sync requests racing (see below).
- **CORS is wide open** (`app.enableCors()` with defaults) since there's no real auth to protect and this never leaves localhost for this exercise.

## What I chose not to build

- **Optimistic concurrency.** Two people editing the same quote at once will silently clobber each other (last write wins), and two concurrent *first* sync calls for the same quote could both slip past the `syncStatus` check before either finishes. Fixing this needs a version column or a DB-level unique constraint on successful sync — straightforward, just out of scope for the time I put into this.
- **Pagination/search/filter on the quote list.** The seed dataset is four quotes; not worth the complexity here.
- **A shared types/logic package between frontend and backend.** They're two independent npm projects, so `totals.ts` is duplicated once (server version is unit-tested; the client version is a direct mirror). A monorepo/workspace setup would remove the duplication but felt like more tooling than the exercise warranted.
- **Real auth, soft delete, audit trail, section/line-item reordering, PDF export, sync retry history.** All reasonable next steps, none required by the spec.

## What I'd do next, given two more days

1. Switch monetary fields to integer cents end-to-end.
2. Add optimistic concurrency (an `updatedAt` or version check on `PATCH`, and a DB constraint that makes double-sync structurally impossible rather than just unlikely).
3. Hoist `totals.ts` and the DTO shapes into a shared package so frontend and backend can't drift.
4. Real login instead of the `X-User-Id`/`GET /users` stand-in.
5. HTTP-level e2e tests (supertest) over the integration tests I have now, which exercise the service layer directly.
6. Sync retry/backoff with a visible attempt history instead of only the latest status.

## Layout

```
backend/   NestJS API — src/quotes (entities, service, totals, controller), src/users, src/organizations,
           src/accounting (fake flaky client), src/common (tenant guard), src/seed
frontend/  React + Vite — src/pages (list, editor), src/context (identity switcher), src/api.ts, src/totals.ts
docker-compose.yml, backend/Dockerfile, frontend/Dockerfile   containerized run, see "Or run it with Docker" above
```
