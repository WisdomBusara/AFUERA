# AFUERA - Noir OS

> Next.js personal OS platform for projects, planning, automations, and AI content work.

*Context exported from your Claude memory on 2026-10-20. This is a summary of what Claude knew about the project, not the source code. "State at import" notes can be stale: check them against the real repo before relying on them. Put this folder at the root of the project (or copy this file into the repo root) so Claude picks it up as project instructions.*

## Purpose
- Noir OS (`noir-os-complete`, originally "Afuera" marketing content ops): personal operating system combining project/task management, daily planning, email check-ins and an AI content workspace. Success = fully deployable, production-ready.

## Stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind; Prisma 6 + PostgreSQL via Supabase (Auth + Storage); Anthropic SDK (streaming); Resend + Vercel Cron; @dnd-kit, Recharts, Zod; deploy on Vercel.
Prisma models (10): Workspace, Member, Campaign, ContentItem, DailyMetric, BrandKit, AutomationRule, Asset, Project, Task.

## Modules
Calendar, Card Detail Drawer, Dashboard, Analytics (Recharts), AI Workspace, Brand Kit, Content Hub, Asset Library, Automation, Projects & Tasks (dnd-kit), Daily Brief, email check-ins, Supabase Auth with workspace scoping.

## State at import (re-verify)
- 58 TS/TSX files, syntax-verified, zero errors, delivered as `noir-os-complete.zip`. NOT yet booted on NOIR's machine.
- Next: deploy to Vercel using the consolidated guide; wire env vars (Supabase, Resend, Anthropic). Possible: Gmail OAuth, Plaid, a proper cron scheduler.

## Principles
- Be transparent about what is wired vs scaffolded; do not fake live data (Inbox Summary, finance).
- Automation executes event-driven stage-entry rules immediately; date/campaign triggers need a separate scheduler (flagged).
