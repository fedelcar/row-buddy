"use client";

import type { Session } from "@/lib/types";
import { splitSeconds } from "@/lib/types";
import { formatDateLong, formatDuration, formatSplit } from "@/lib/format";

export function SessionTable({
  sessions,
  onDelete,
}: {
  sessions: Session[];
  onDelete: (id: string) => void;
}) {
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-surface-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-ink-muted">
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 text-right font-medium">Distance</th>
            <th className="px-4 py-2.5 text-right font-medium">Time</th>
            <th className="px-4 py-2.5 text-right font-medium">Split /500m</th>
            <th className="px-4 py-2.5 text-right font-medium">SPM</th>
            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Notes</th>
            <th className="px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} className="border-b border-hairline last:border-b-0">
              <td className="whitespace-nowrap px-4 py-2.5 text-ink">{formatDateLong(s.date)}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                  <span
                    aria-hidden
                    className={`inline-block h-2 w-2 rounded-full ${
                      s.type === "erg" ? "bg-series-1" : "bg-ink-muted"
                    }`}
                  />
                  {s.type === "erg" ? "Erg" : "Water"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right text-ink tabular-nums">
                {s.distanceMeters.toLocaleString("en-US")} m
              </td>
              <td className="px-4 py-2.5 text-right text-ink tabular-nums">
                {formatDuration(s.durationSeconds)}
              </td>
              <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                {formatSplit(splitSeconds(s))}
              </td>
              <td className="px-4 py-2.5 text-right text-ink-secondary tabular-nums">
                {s.strokeRate ?? "—"}
              </td>
              <td className="hidden max-w-56 truncate px-4 py-2.5 text-ink-secondary md:table-cell">
                {s.notes ?? ""}
              </td>
              <td className="px-2 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(s.id)}
                  aria-label={`Delete session on ${formatDateLong(s.date)}`}
                  className="rounded px-2 py-1 text-xs text-ink-muted hover:text-delta-bad"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
