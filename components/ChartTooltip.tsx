"use client";

interface Row {
  label: string;
  value: string;
}

export function ChartTooltip({
  x,
  y,
  containerWidth,
  title,
  rows,
}: {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  rows: Row[];
}) {
  const flip = x > containerWidth - 150;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-hairline bg-surface-1 px-3 py-2 shadow-md"
      style={{
        left: flip ? undefined : x + 12,
        right: flip ? containerWidth - x + 12 : undefined,
        top: Math.max(0, y - 8),
      }}
    >
      <div className="whitespace-nowrap text-xs text-ink-muted">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-sm font-semibold text-ink tabular-nums">{row.value}</span>
          <span className="text-xs text-ink-secondary">{row.label}</span>
        </div>
      ))}
    </div>
  );
}
