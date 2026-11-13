# AFUERA - Noir OS

> Next.js personal OS platform for projects, planning, automations, and AI content work.

*Context exported from your Claude memory on 2026-10-20. This is a summary of what Claude knew about the project, not the source code. "State at import" notes can be stale: check them against the real repo before relying on them. Put this folder at the root of the project (or copy this file into the repo root) so Claude picks it up as project instructions.*

## Purpose
- Noir OS (`noir-os-complete`, originally "Afuera" marketing content ops): personal operating system combining project/task management, daily planning, email check-ins and an AI content workspace. Success = fully deployable, production-ready.

## Stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind; Prisma 6 + MongoDB (replica set required); built-in email/password auth (scrypt + signed session cookie, no public sign-up — `npm run db:admin`); asset uploads on local disk; Anthropic SDK (streaming); email via SMTP (Brevo relay) + a systemd timer; @dnd-kit, Recharts, Zod. Supabase, Resend and Vercel are no longer used.
Hosted on the `ianprojects` VPS at https://afuera.wisdombusara.com via a dedicated Cloudflare Tunnel — runbook: `noir-os-complete/noir-os-complete/01-nextjs-app/deploy/TUNNEL.md`.
Prisma models (10): Workspace, Member, Campaign, ContentItem, DailyMetric, BrandKit, AutomationRule, Asset, Project, Task.

## Modules
Calendar, Card Detail Drawer, Dashboard, Analytics (Recharts), AI Workspace, Brand Kit, Content Hub, Asset Library, Automation, Projects & Tasks (dnd-kit), Team, Daily Brief, email check-ins, workspace-scoped auth.

## State (2026-11-13)
- Live on the VPS; builds and deploys with `deploy/deploy.sh`. There is no seed/demo data: `npm run db:admin` creates the first super admin and an empty workspace.
- Every number shown is derived from real rows (no AI score, no campaign "health"); analytics come from metrics logged by hand on the Analytics page.
- Automations: stage-entry rules run inline in `moveCard`; publish-date and campaign-end rules run from `/api/cron/automations` via a 15-minute systemd timer.
- Not built: Inbox Summary (Gmail OAuth), MoneyMap / PointPile, reassigning a card's owner or campaign after creation, real social publishing.

## Principles
- Never add seeded, sample or placeholder data to make a screen look full; build the empty state instead.
- Be transparent about what is wired vs scaffolded; do not fake live data (Inbox Summary, finance).
- Automation executes event-driven stage-entry rules immediately; date/campaign triggers need a separate scheduler (flagged).
