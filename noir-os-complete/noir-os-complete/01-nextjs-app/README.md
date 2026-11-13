# Noir OS

A personal operating system and content workspace in one Next.js app: projects and tasks,
a daily brief by email, and a content pipeline (board, calendar, campaigns, approvals,
analytics, assets, brand kit, automations, AI assistant). Everything is scoped to a
workspace and sits behind sign-in.

Live at https://afuera.wisdombusara.com. Deployment runbook: [`deploy/TUNNEL.md`](deploy/TUNNEL.md).

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind · Prisma 6 on
**MongoDB** (a replica set is required) · built-in email/password auth (scrypt + signed
session cookie) · `@dnd-kit` · Recharts · Zod · Anthropic SDK (streaming) · SMTP email via
nodemailer.

## No demo data

There is no seed script. `npm run db:admin` creates the first super admin and an empty
workspace; everything else is created in the UI. Every figure on screen is computed from
real rows — nothing is estimated, sampled or hardcoded.

## Modules

| Module | What you can do |
| --- | --- |
| **Daily Brief** (`/brief`) | Tasks due today, the next 7 days, project progress. "Email me this brief" sends it now; a timer sends it every morning. |
| **Projects & Tasks** (`/projects`) | Create, rename, re-status and delete projects. Add, complete and delete tasks; set each task's due date and priority. |
| **Content board** (`/board`) | Drag cards across 11 stages. Create cards; open one to edit its title, priority and due date, set a publish date, comment, advance or delete it. |
| **Calendar** (`/board/calendar`) | Cards with a publish date on a month grid; drag to reschedule. |
| **Campaigns** (`/campaigns`) | Create, edit (name, colour, objective, end date) and delete campaigns. Progress is published ÷ total cards. A campaign with content can't be deleted. |
| **Approval Center** (`/approvals`) | Approve (advance a stage) or request changes (back to Writing) for cards in Review, Legal or Approval. |
| **Content Hub** (`/hub`) | Search and filter every card by title and status; the top-bar search lands here. |
| **Analytics** (`/analytics`) | Log impressions, reach, engagements and clicks per published card per day; charts and KPIs total those entries over 8 weeks. Entries can be deleted. |
| **Asset Library** (`/assets`) | Upload (25 MB max), preview and delete files, stored on the server's disk and visible only to the workspace. |
| **Brand Kit** (`/brand`) | Edit colours, fonts, voice rules, voice summary, hashtags and the legal disclaimer. The AI assistant uses it as its voice guide. |
| **Automation** (`/automations`) | Create, rename, enable/disable and delete rules. See below. |
| **AI Workspace** (`/ai`) | Streaming chat with your pipeline, campaigns and brand kit as context. Needs `ANTHROPIC_API_KEY`. |
| **Team** (`/team`) | Add, edit and remove members. A super admin sets passwords (which is what lets someone sign in) and renames the workspace. |

### Automations

A rule is a trigger plus an action.

| Trigger | Runs | Allowed actions |
| --- | --- | --- |
| A card enters a stage | immediately, inside the move | move to a stage · archive · create a follow-up task · email the team |
| A scheduled card's publish date arrives | scheduler, every 15 min | move to a stage · archive |
| A campaign's end date passes | scheduler, every 15 min | move to a stage · archive (all its unarchived cards) |

Stage-entry rules stop at the first rule that moves the card, so rules can't chain into a
loop. The scheduler is `GET /api/cron/automations`, guarded by `CRON_SECRET`.

### Not built

Inbox Summary (needs Gmail OAuth), MoneyMap / PointPile (need bank or card data),
publishing to social networks (Published is a stage you move a card to), and changing a
card's owner or campaign after it is created.

## Local setup

```bash
npm install
cp .env.example .env          # fill in — see the comments in that file
npm run db:push               # create collections + indexes
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='at-least-12-chars' npm run db:admin
npm run dev                   # http://localhost:3000
```

MongoDB must be a replica set (Prisma uses transactions): Atlas, or a local
`mongod --replSet rs0` followed by `rs.initiate()` once.

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run db:push` | Sync collections and indexes to MongoDB (never touches data) |
| `npm run db:admin` | Create a super admin, or reset that account's password |
| `npm run db:studio` | Browse documents in Prisma Studio |

MongoDB has no SQL migrations; `db:push` is how schema and index changes are applied.

## How it is put together

```
src/middleware.ts            Verifies the session cookie; redirects to /login
src/lib/session.ts           Signs/verifies the cookie (HS256, AUTH_SECRET)
src/lib/auth.ts              getSessionMember / requireMember → the signed-in Member
src/lib/password.ts          scrypt hashing
src/lib/cards.ts             Shared card query include + DTO mapping
src/lib/automations.ts       Rule engine (stage-entry + scheduled)
src/lib/brief.ts, email.ts   Daily brief assembly + SMTP
src/lib/storage.ts           Asset files on disk (ASSETS_DIR)
src/app/<module>/
  page.tsx                   Server component: requireMember(), query by workspaceId
  <module>-client.tsx        Client component: interaction + optimistic state
  actions.ts                 Server actions: Zod-validated, workspace-authorised
src/app/api/                 AI stream, asset upload/download, cron endpoints
```

Every server action re-checks the session and confirms the row it touches belongs to the
caller's workspace. Board ordering uses a fractional `position`, so a move is one update.
