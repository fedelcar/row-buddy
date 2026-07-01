export function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 px-4 py-3">
      <div className="text-sm text-ink-secondary">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {detail && <div className="mt-0.5 text-xs text-ink-muted">{detail}</div>}
    </div>
  );
}
