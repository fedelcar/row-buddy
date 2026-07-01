import Link from "next/link";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-hairline px-4 py-2.5 text-sm text-ink-secondary hover:text-ink";
export const inputClass =
  "w-full rounded-lg border border-hairline bg-surface-1 px-3 py-2.5 text-base sm:text-sm text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-hairline bg-surface-1 ${className}`}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className={btnPrimary}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">{body}</p>
      {action && (
        <div className="mt-5">
          <Link href={action.href} className={btnPrimary}>
            {action.label}
          </Link>
        </div>
      )}
    </Card>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline px-2 py-0.5 text-xs text-ink-secondary">
      {children}
    </span>
  );
}
