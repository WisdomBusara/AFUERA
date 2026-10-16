# Noir OS — Complete Build

Your **personal operating system**: projects, day-to-day plans, a morning brief emailed
to you, plus a full content workspace — one Next.js 15 + Prisma + MongoDB app behind Supabase auth.

| Folder | What it is |
| --- | --- |
| `01-nextjs-app/` | **The real product.** Deploy this. Start with its `README.md`. |
| `02-interactive-prototype/` | The original single-file React prototype (design feel only). |

All source files parse with **0 syntax errors** and were reviewed by hand (see
"Verification" below for what that does and doesn't guarantee).

---

## Modules

**Personal layer (new):**
- **Daily Brief** (`/`, the landing page) — today's tasks, what's coming up, project progress, a daily spark; plus **"Email me this brief."**
- **Projects & Tasks** (`/projects`) — **full CRUD**: create/rename/delete projects, set status, add/complete/delete tasks, and a "Day-to-day" list for tasks with no project.
- **Email check-ins** — a real Resend integration; the brief is emailed on demand and every morning via **Vercel Cron**.

**Content layer (carried over, all live):**
- Dashboard, Content board (Kanban + Calendar), card drawer, create composer, Approval Center, Campaigns, Analytics (real metrics table), AI Workspace (streaming Anthropic API, workspace- + brand-aware), Content Hub, Brand Kit, Automation (event-driven executor), Asset Library (Supabase Storage uploads).

Everything is behind **Supabase Auth**, scoped to a **workspace**.

---

## Setup (full version in `01-nextjs-app/README.md`)

```bash
cd 01-nextjs-app
npm install
cp .env.example .env        # fill values below
npm run db:push
npm run db:seed             # creates the demo workspace, projects, tasks, content
npm run dev                 # → http://localhost:3000 (opens the Daily Brief after login)
```

Env values:
- **Required:** `DATABASE_URL` (MongoDB replica set — Atlas or local `--replSet`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **AI Workspace:** `ANTHROPIC_API_KEY`
- **Email check-ins:** `RESEND_API_KEY`, `NOIR_FROM_EMAIL`, `CRON_SECRET`
- **Asset Library:** create a public `assets` Storage bucket + 2 policies (SQL in README)

---

## What's pending / honest boundaries

**1. Not run in this environment.** The code is written and syntax-verified, but I could
not `npm install`, run Prisma/migrations, `next build`, or reach Supabase/Anthropic/Resend
from the sandbox. **First real boot is on your machine** — budget for one or two first-run
fixes (an env value, the Storage bucket, model/email access).

**2. Three mockup modules are intentionally not built** (they need integrations, and I
won't fake live data):
- **Inbox Summary** → needs **Gmail OAuth** (read your mail). Big, separate consent flow.
- **MoneyMap** / **PointPile** → need **bank/card sync (Plaid)** for live data. Buildable
  now as *manual-entry* CRUD modules (same pattern as Projects), just not auto-synced.

**3. Email specifics.** Sending works once `RESEND_API_KEY` is set; the free "from"
(`onboarding@resend.dev`) only sends to your own account email — a real domain needs
verifying in Resend. The daily cron runs on Vercel only (via `vercel.json`).

**4. Team is now built** — `/team` does full, workspace-scoped roster CRUD. What's left:
a real invite/email flow so a roster profile and that person's eventual login resolve to the
*same* member (today a fresh sign-up provisions its own member row).

**5. Synthetic where noted:** Analytics numbers are seeded, not live platform data;
publishing is a stage, not a real social integration.

**6. Not production-hardened:** no tests/CI, no rate limiting on the AI/cron routes,
minimal error boundaries, and this is not a security audit (though server actions are
auth-checked and workspace-scoped).

**7. Workspace model.** New users are provisioned into the shared seeded workspace (so the
demo isn't empty). For a true personal OS you'd auto-create a fresh workspace per user —
a small change in `src/lib/auth.ts`.

---

## Suggested next steps
1. Boot locally; confirm Projects CRUD + the Daily Brief against your own Supabase.
2. Turn on email: set the Resend + cron env vars, deploy, verify the morning send.
3. Build **MoneyMap** and **PointPile** as manual-entry CRUD (fast, same pattern).
4. Add **Gmail OAuth** for a real Inbox Summary (the heavy one).
5. Consider per-user workspaces (see #7) and a real invite flow for **Team**.
