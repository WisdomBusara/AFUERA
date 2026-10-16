# Noir OS

Your **personal operating system** — projects, day-to-day plans, a morning brief that
lands in your inbox, and a full content workspace, on one Next.js 15 + Prisma + MongoDB
foundation with Supabase Auth and per-workspace scoping.

Noir OS grew out of a content-operations platform (Afuera), so it ships with two layers:
a **personal layer** (Daily Brief, Projects/Tasks, email check-ins) and a **content
layer** (board, campaigns, approvals, analytics, AI, assets, brand kit). Both run over
the same authenticated, workspace-scoped data model.

## Noir OS — personal layer

| Module | Status |
| --- | --- |
| **Daily Brief** (`/`, the landing page) | **Wired.** Today's tasks, what's coming up, project progress, and a daily spark — all from your data. A **"Email me this brief"** button sends it now. |
| **Projects & Tasks** (`/projects`) | **Wired, full CRUD.** Create/rename/delete projects, set status; add/complete/delete tasks; a "Day-to-day" list for tasks with no project. Optimistic UI, workspace-authorized server actions. |
| **Email check-ins** | **Wired (needs a Resend key).** `src/lib/email.ts` (Resend) + `src/lib/brief.ts` render an HTML brief. Sent on demand from the Daily Brief, and every morning via **Vercel Cron** (`/api/cron/daily-brief`, secured by `CRON_SECRET`). |
| Inbox Summary / MoneyMap / PointPile | **Not built.** Inbox needs Gmail OAuth; money/points need bank/card sync (Plaid). Buildable as manual-entry CRUD next, but not faked as live data. |


## Content layer — wired vs. scaffolded

| Area | Status |
| --- | --- |
| Auth + workspace scoping | **Real.** Supabase Auth (email/password) via `@supabase/ssr`, session refresh in middleware, protected routes. Every query is scoped to the signed-in member's `Workspace`. First login auto-provisions a member into the demo workspace. |
| Content board — **Kanban** | **End-to-end.** `@dnd-kit` drag/drop across all 11 lifecycle stages → optimistic UI → Server Action → Prisma → MongoDB, fractional-index ordering, WIP-limit warnings. |
| Content board — **Calendar** | **End-to-end.** Month grid; drag a chip to a day to reschedule (persists via `rescheduleCard`). Same data as the board, different view. |
| Card detail drawer | **Wired.** Shared by both views. Advance a card through the lifecycle (`moveCard`) and set/clear its publish date (`rescheduleCard`) — both persist. |
| Create content | **Wired.** Composer dialog behind every "Add card" button and the top-bar "Create" — calls the workspace-authorized `createCard` action, then optimistically drops the card into its column. |
| Dashboard | **Wired (read-only).** Landing page. Aggregates the one workspace query into command-center cards (WIP, approval queue, deadlines, campaign health, recent updates, data-driven signals) + a Recharts pipeline/channel snapshot. |
| Analytics | **Wired (read-only).** A real **`DailyMetric`** time-series table (8 weeks, seeded per published item). Workspace-scoped `groupBy` aggregates → KPIs with week-over-week deltas, a Recharts reach/engagement trend, channel breakdown, and top content. |
| Approval Center | **Wired.** Workspace-scoped queue of Review/Legal/Approval items. **Approve** advances a stage; **Request changes** sends it back to Writing — both server actions with optimistic UI. |
| Campaigns | **Wired (read-only).** Per-campaign cards: health meter, stage-distribution bar, review/scheduled/published counts, and contributor avatars — all derived from the workspace query. |
| AI Workspace | **Wired (real model).** Streaming chat against the **Anthropic API** (`/api/ai`), auth-gated, with the workspace's live pipeline/campaigns injected as context and the Brand Kit voice in the system prompt. Powers the top-bar “Ask AI”. |
| Brand Kit | **Wired (read-only).** Stored per-workspace (`BrandKit` table): colours, type, voice rules, approved hashtags, legal disclaimer. **Feeds the AI Workspace system prompt** — the assistant's voice is now data-driven, not hardcoded. |
| Content Hub | **Wired (read-only).** Searchable, filterable library over all `ContentItem` (in-progress / scheduled / published / archived), with live title search. |
| Automation | **Wired.** `AutomationRule` table with enable toggles + a create form. A real **event-driven executor** runs stage-entry rules inside `moveCard` (no cron): enable “card enters Approval → move to Scheduled”, drag a card in, and it auto-advances. Date/campaign triggers are defined but marked as needing a scheduler. |
| Asset Library | **Wired (real uploads).** Files upload to a **Supabase Storage** bucket from the browser; metadata is recorded per-workspace; grid renders public URLs; delete removes from Storage + DB. |
| Data layer | **Real.** Prisma schema on **MongoDB** (workspace, members, campaigns, content, enums, ObjectId relations) + seed script for the demo brand *Northbound*. |
| Design system | **Ported.** Afuera tokens (the azure→dawn "horizon" signature) + shadcn theme tokens in `globals.css`. |
| Team | **Wired, full CRUD.** `/team` manages the workspace roster — add teammates, edit name/role/colour/email, toggle online, remove (blocked while they still own content, or for yourself). Optimistic UI, workspace-authorized server actions. Roster-only profiles show **Pending** until a real sign-up links them. |

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS ·
shadcn/ui conventions · `@dnd-kit` · Prisma 6 · **MongoDB** + **Supabase Auth** · Zod ·
Recharts + a **DailyMetric** time-series collection + the **Anthropic API** (streaming) + **Supabase Storage**.

## Prerequisites

- Node.js 18.18+ (20+ recommended)
- A MongoDB **replica set** — a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
  (replica set by default), or a local single-node replica set (`mongod --replSet rs0`).
  Prisma's MongoDB connector uses transactions, which require a replica set.
- A free [Supabase](https://supabase.com) project (Auth + Storage only)

## Setup

```bash
# 1. Install
npm install

# 2. Configure — copy the template and fill in the values
cp .env.example .env
#   MongoDB (Atlas → Connect → Drivers):  DATABASE_URL (must point at a replica set)
#   Supabase Settings → API:              NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
#   (optional) AI Workspace:              ANTHROPIC_API_KEY  — required only for /ai to respond
#   (optional) Email check-ins:           RESEND_API_KEY, NOIR_FROM_EMAIL, CRON_SECRET

# 3. Create the schema + seed the demo workspace
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000 — you'll be redirected to **/login**. Sign up with any email
and you're provisioned into the seeded **Northbound** workspace, landing on the
**Dashboard**. Open the board, drag a card, switch to Calendar, create a card, advance
it — then refresh: it all persisted to MongoDB.

> **Faster demo:** in Supabase → Authentication → Providers → Email, turn **off**
> "Confirm email" so sign-up logs you in immediately. Otherwise confirm via the emailed
> link (handled by `/auth/confirm`), then sign in.


### Supabase Storage (for the Asset Library)

Create a **public** bucket named `assets` (Storage → New bucket → Public), then allow
authenticated users to upload and delete. In the SQL editor:

```sql
create policy "authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'assets');
create policy "authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'assets');
```

Public read is already covered by the bucket being public. Without this, the app still
runs — the Asset Library just shows an upload error until the bucket exists.

## Useful scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run db:push` | Sync `schema.prisma` to MongoDB (creates collections + indexes) |
| `npm run db:seed` | Load the Northbound demo workspace |
| `npm run db:studio` | Inspect documents in Prisma Studio |

> MongoDB is schemaless, so there are no SQL migrations here — `prisma migrate` is not
> supported on the MongoDB connector. `db push` is the way you apply schema/index changes.

## Architecture

### Auth & scoping
```
src/lib/supabase/{client,server,middleware}.ts   @supabase/ssr clients
src/middleware.ts                                 Session refresh + route guard
src/lib/auth.ts                                   getSessionMember / requireMember
                                                  → resolves the Supabase user to a
                                                    workspace Member (provisioning on
                                                    first login)
src/app/login/page.tsx                            Sign in / sign up
src/app/auth/{actions.ts,confirm/route.ts}        Sign out + email confirmation
```
Server pages call `requireMember()` (redirects to `/login` if signed out) and filter
Prisma queries by `workspaceId`. Server Actions re-check the session and verify the
target row belongs to the caller's workspace before mutating.

### The board (the pattern to copy)
```
src/app/dashboard/
  page.tsx                     Server Component. Aggregates the workspace query into
                               command-center cards (read-only, same pattern).
  dashboard-charts.tsx         "use client". Recharts pipeline + channel snapshot.
src/app/analytics/
  page.tsx                     Server Component. groupBy over DailyMetric → KPIs,
                               channel + top-content aggregates (workspace-scoped).
  analytics-charts.tsx         "use client". Recharts reach/engagement trend.
src/app/approvals/
  page.tsx, approvals-client.tsx, actions.ts
                               Review/Legal/Approval queue + approve / request-changes.
src/app/campaigns/
  page.tsx                     Read-only campaign cards (workspace aggregates).
src/app/ai/
  page.tsx, ai-client.tsx      Streaming chat UI + prompt library.
src/app/api/ai/route.ts        Auth-gated stream from the Anthropic API; injects live
                               workspace context + BrandKit voice into the system prompt.
src/app/brand/page.tsx         Read-only Brand Kit (feeds the AI voice above).
src/app/hub/
  page.tsx, hub-client.tsx     Searchable content library.
src/app/automations/
  page.tsx, automations-client.tsx, actions.ts   Rules + toggles + create.
src/lib/automations.ts         Event-driven executor (called from moveCard).
src/app/assets/
  page.tsx, assets-client.tsx, actions.ts        Supabase Storage uploads + grid.
src/app/board/
  page.tsx                     Server Component. Auth-scoped Prisma read → serialise
                               Dates → render shell + Kanban client.
  board-client.tsx             "use client". @dnd-kit multi-column board, optimistic
                               state, fractional-index persistence, drawer wiring.
  calendar/page.tsx            Server Component for the Calendar view.
  calendar/calendar-client.tsx "use client". Month grid, drag-to-reschedule.
  content-card.tsx             Presentational card (also the drag overlay).
  actions.ts                   "use server". moveCard / rescheduleCard / createCard —
                               Zod-validated, workspace-authorised, single-row updates,
                               revalidatePath('/board' + '/board/calendar').
src/components/
  card-drawer.tsx              Shared detail drawer (advance stage + reschedule).
  create-card-dialog.tsx       Composer → createCard, with optimistic insert.
  view-switcher.tsx            Kanban ⇄ Calendar segmented control.
  app-shell.tsx                Sidebar + top bar (the "horizon" signature) + sign-out.
```

Ordering uses a `position: Float` per card, so a reorder is **one document update**, not a
column renumber. A card dropped between two others takes the midpoint of their positions.

**To add the next module** (e.g. Team): mirror the board — a server
component that `requireMember()` + queries Prisma by `workspaceId`, a client view for
interaction, and a workspace-authorised Server Action per mutation.

## Deploy to Vercel

The app is Vercel-ready: the build runs `prisma generate`, every data page is
`force-dynamic` (so the build never connects to the DB), the AI route pins the Node
runtime, and the Prisma generator includes the serverless binary target.

**One-time, before the first deploy — prepare the production database.** `db push` has no
migration files, so sync the schema (collections + indexes) to your production MongoDB
from your machine:

```bash
# .env points at your PRODUCTION MongoDB (DATABASE_URL = Atlas replica set)
npm run db:push
npm run db:seed        # optional: loads the Northbound demo workspace
```

**Deploy.**
1. Push the repo to GitHub/GitLab and **Import Project** in Vercel (framework auto-detects as Next.js).
2. Add **Environment Variables** (Production + Preview):
   - `DATABASE_URL` — MongoDB Atlas connection string (a replica set; `mongodb+srv://…`)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`)
3. **Deploy.** No build settings to change — `prisma generate && next build` is the build command.
4. **Supabase → Authentication → URL Configuration:** set **Site URL** to your Vercel
   domain and add it (plus `https://*.vercel.app` for previews) to **Redirect URLs**, so
   email confirmation / sign-in redirects resolve.
5. **Supabase → Storage:** confirm the public `assets` bucket + policies exist (needed for
   the Asset Library).
6. Optional: set the Vercel project **Region** close to your Supabase region to cut latency.

**Notes.**
- `DATABASE_URL` must point at a **replica set** (Atlas is one by default). Allow Vercel's
  egress in Atlas → Network Access (add `0.0.0.0/0`, or Atlas's Vercel integration).
- The database is not touched during the Vercel build — you sync the schema yourself
  (step above). Schema/index changes = re-run `npm run db:push` against production, then redeploy.
- The **daily email check-in** is already wired as a Vercel Cron (`vercel.json`, 13:00 UTC).
  Set `RESEND_API_KEY`, `NOIR_FROM_EMAIL`, and `CRON_SECRET` in Vercel to turn it on.
- Other time-based automations (publish-date / campaign-end) still need their own scheduler.
