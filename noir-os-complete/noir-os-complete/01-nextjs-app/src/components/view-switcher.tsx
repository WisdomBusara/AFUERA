"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Calendar as CalIcon } from "lucide-react";

const VIEWS = [
  { href: "/board", label: "Kanban", icon: LayoutGrid },
  { href: "/board/calendar", label: "Calendar", icon: CalIcon },
];

export function ViewSwitcher() {
  const pathname = usePathname();
  return (
    <div className="inline-flex gap-0.5 rounded-[10px] bg-[var(--afa-surface-3)] p-0.5">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const active = pathname === v.href;
        return (
          <Link
            key={v.href}
            href={v.href}
            className={
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition " +
              (active
                ? "bg-[var(--afa-surface)] text-[var(--afa-ink)] shadow-[var(--sh-1)]"
                : "text-[var(--afa-ink-2)] hover:text-[var(--afa-ink)]")
            }
          >
            <Icon size={14} /> {v.label}
          </Link>
        );
      })}
    </div>
  );
}
