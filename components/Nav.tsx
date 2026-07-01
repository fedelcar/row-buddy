"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" d="M4 19V10m5.5 9V5M15 19v-6m5 6V8" />
      </svg>
    ),
  },
  {
    href: "/athletes",
    label: "Athletes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <circle cx="9" cy="8" r="3.2" />
        <path strokeLinecap="round" d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M15.5 5.4a3.2 3.2 0 1 1 1 6.2m1 2.9c1.6.7 2.7 2 3 4.5" />
      </svg>
    ),
  },
  {
    href: "/sessions",
    label: "Sessions",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path strokeLinecap="round" d="M4 9.5h16M8 3v4m8-4v4" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(pathname, l.href) ? "page" : undefined}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive(pathname, l.href)
              ? "bg-series-1-wash font-medium text-ink"
              : "text-ink-secondary hover:text-ink"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface-1 pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="grid grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
              isActive(pathname, l.href) ? "font-semibold text-accent" : "text-ink-secondary"
            }`}
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
