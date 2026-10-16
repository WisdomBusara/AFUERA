"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, LayoutGrid, FolderOpen, Megaphone, ShieldCheck, Sparkles,
  Image as ImageIcon, Palette, BarChart3, Zap, Users, Search, Bell, Plus, Menu,
  ChevronDown, LogOut, Sunrise, FolderKanban,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signout } from "@/app/auth/actions";

type NavItem = { label: string; href?: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; count?: number };
type NavGroup = { group: string; items: NavItem[] };

function buildNav(boardCount: number, approvalCount: number): NavGroup[] {
  return [
    {
      group: "Today",
      items: [
        { label: "Daily Brief", href: "/brief", icon: Sunrise },
        { label: "Projects", href: "/projects", icon: FolderKanban },
      ],
    },
    {
      group: "Operate",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Content board", href: "/board", icon: LayoutGrid, count: boardCount },
        { label: "Content Hub", href: "/hub", icon: FolderOpen },
        { label: "Campaigns", href: "/campaigns", icon: Megaphone },
        { label: "Approval Center", href: "/approvals", icon: ShieldCheck, count: approvalCount },
      ],
    },
    {
      group: "Create",
      items: [
        { label: "AI Workspace", href: "/ai", icon: Sparkles },
        { label: "Asset Library", href: "/assets", icon: ImageIcon },
        { label: "Brand Kit", href: "/brand", icon: Palette },
      ],
    },
    {
      group: "Run",
      items: [
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
        { label: "Automation", href: "/automations", icon: Zap },
        { label: "Team", href: "/team", icon: Users },
      ],
    },
  ];
}

export function AppShell({
  children,
  title,
  workspaceName = "Workspace",
  user,
  boardCount = 0,
  approvalCount = 0,
  rightSlot,
}: {
  children: React.ReactNode;
  title: string;
  workspaceName?: string;
  user?: { name: string; initials: string; color: string; role: string };
  boardCount?: number;
  approvalCount?: number;
  rightSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = buildNav(boardCount, approvalCount);

  return (
    <div className="afa-shell">
      <aside className={"afa-rail" + (open ? " open" : "")}>
        <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
          <div className="afa-mark" />
          <div>
            <h1 className="text-[16px] font-semibold tracking-tight leading-none">Noir OS</h1>
            <div className="text-[11px] text-[var(--afa-ink-3)] mt-0.5">Personal Operating System</div>
          </div>
        </div>

        <div className="mx-3 mb-2 flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--afa-line)] bg-[var(--afa-surface-2)] px-2.5 py-2">
          <div className="grid h-[26px] w-[26px] place-items-center rounded-lg text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#171A21,#3A4150)" }}>
            {workspaceName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold leading-none">{workspaceName}</div>
            <div className="text-[10.5px] text-[var(--afa-ink-3)]">Outdoor · Marketing</div>
          </div>
          <ChevronDown size={15} className="ml-auto text-[var(--afa-ink-4)]" />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
          {nav.map((grp) => (
            <div key={grp.group}>
              <div className="afa-nav-h">{grp.group}</div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const active = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;
                const inner = (
                  <>
                    <Icon size={16} strokeWidth={active ? 2.3 : 2} />
                    {item.label}
                    {item.count != null ? (
                      <span className="ct">{item.count}</span>
                    ) : !item.href ? (
                      <span className="soon">SOON</span>
                    ) : null}
                  </>
                );
                return item.href ? (
                  <Link key={item.label} href={item.href} className={"afa-nav-i" + (active ? " on" : "")} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <button key={item.label} className="afa-nav-i" type="button" title="Not in this scaffold yet">
                    {inner}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 border-t border-[var(--afa-line)] px-3 py-2.5">
          <Avatar initials={user?.initials ?? "?"} color={user?.color ?? "#98A2B3"} size={30} name={user?.name} />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold">{user?.name ?? "Signed in"}</div>
            <div className="afa-meta text-[10.5px]">{user?.role ?? "Member"}</div>
          </div>
          <form action={signout} className="ml-auto">
            <button type="submit" className="grid h-[30px] w-[30px] place-items-center rounded-lg text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="afa-top">
          <button className="grid h-9 w-9 place-items-center rounded-lg text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)] md:hidden" onClick={() => setOpen((o) => !o)}>
            <Menu size={18} />
          </button>
          <div className="text-[14.5px] font-semibold tracking-tight">{title}</div>

          <div className="ml-1.5 hidden max-w-[420px] flex-1 cursor-text items-center gap-2 rounded-[10px] bg-[var(--afa-surface-3)] px-2.5 py-[7px] text-[var(--afa-ink-3)] sm:flex">
            <Search size={15} />
            <span className="text-[13px]">Search or ask AI…</span>
            <span className="mono ml-auto rounded-[5px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-1.5 py-px text-[10.5px]">⌘K</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {rightSlot}
            <button className="relative grid h-[34px] w-[34px] place-items-center rounded-lg text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]">
              <Bell size={18} />
              <span className="absolute right-2 top-[7px] h-1.5 w-1.5 rounded-full border-[1.5px] border-[var(--afa-surface)] bg-[var(--afa-bad)]" />
            </button>
            <Link href="/ai" className="afa-ai-btn">
              <Sparkles size={15} /> Ask AI
            </Link>
            <button
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-3 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)]"
              onClick={() => window.dispatchEvent(new CustomEvent("afuera:create"))}
            >
              <Plus size={15} /> Create
            </button>
          </div>
        </header>
        <div className="afa-horizon" />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
