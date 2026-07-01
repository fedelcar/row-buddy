"use client";

import { useMemo, useState } from "react";
import type { SessionType } from "@/lib/types";
import { sampleSessions } from "@/lib/storage";
import { useHydrated, useSessions } from "@/lib/useSessions";
import { splitTrend, totals, weeklyVolume } from "@/lib/stats";
import { formatDateLong, formatDuration, formatMeters, formatSplit } from "@/lib/format";
import { StatTile } from "@/components/StatTile";
import { WeeklyVolumeChart } from "@/components/WeeklyVolumeChart";
import { SplitTrendChart } from "@/components/SplitTrendChart";
import { SessionForm } from "@/components/SessionForm";
import { SessionTable } from "@/components/SessionTable";

type RangeKey = "30d" | "90d" | "year" | "all";
type TypeFilter = "all" | SessionType;

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

const TYPE_FILTERS: Array<{ key: TypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "erg", label: "Erg" },
  { key: "water", label: "Water" },
];

function rangeStart(key: RangeKey): string | null {
  const now = new Date();
  if (key === "all") return null;
  if (key === "year") return `${now.getFullYear()}-01-01`;
  const d = new Date();
  d.setDate(d.getDate() - (key === "30d" ? 30 : 90));
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [sessions, update] = useSessions();
  const hydrated = useHydrated();
  const [range, setRange] = useState<RangeKey>("90d");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const start = rangeStart(range);
    return sessions.filter(
      (s) =>
        (start === null || s.date >= start) &&
        (typeFilter === "all" || s.type === typeFilter),
    );
  }, [sessions, range, typeFilter]);

  const t = useMemo(() => totals(filtered), [filtered]);
  const weeks = useMemo(() => weeklyVolume(filtered), [filtered]);
  const trend = useMemo(() => splitTrend(filtered), [filtered]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Row Buddy</h1>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Your rowing log — meters, splits, and progress.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            + Log session
          </button>
        )}
      </header>

      {showForm && (
        <div className="mt-6">
          <SessionForm
            onAdd={(s) => {
              update([...sessions, s]);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {hydrated && sessions.length === 0 && !showForm && (
        <div className="mt-10 rounded-xl border border-hairline bg-surface-1 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-ink">No sessions yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
            Log your first row to start tracking volume and split trends, or load
            sample data to explore the dashboard.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
            >
              + Log session
            </button>
            <button
              type="button"
              onClick={() => update(sampleSessions())}
              className="rounded-lg border border-hairline px-4 py-2 text-sm text-ink-secondary hover:text-ink"
            >
              Load sample data
            </button>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <>
          {/* Filters scope everything below them */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-lg border border-hairline p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={range === r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    range === r.key
                      ? "bg-accent font-medium text-accent-ink"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg border border-hairline p-0.5">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={typeFilter === f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    typeFilter === f.key
                      ? "bg-accent font-medium text-accent-ink"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-xl border border-hairline bg-surface-1 px-6 py-10 text-center text-sm text-ink-secondary">
              No sessions match these filters.
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Total distance" value={`${formatMeters(t.meters)} m`} />
                <StatTile
                  label="Sessions"
                  value={String(t.sessions)}
                  detail={`${formatDuration(t.seconds)} total`}
                />
                <StatTile
                  label="Best avg split"
                  value={t.bestSplit ? `${formatSplit(t.bestSplit)}` : "—"}
                  detail={
                    t.bestSplitSession
                      ? `${formatMeters(t.bestSplitSession.distanceMeters)} m on ${formatDateLong(t.bestSplitSession.date)}`
                      : undefined
                  }
                />
                <StatTile
                  label="Avg per week"
                  value={
                    weeks.length > 0 ? `${formatMeters(Math.round(t.meters / weeks.length))} m` : "—"
                  }
                  detail={`across ${weeks.length} ${weeks.length === 1 ? "week" : "weeks"}`}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-hairline bg-surface-1 p-4">
                  <h2 className="text-sm font-semibold text-ink">Weekly volume</h2>
                  <p className="text-xs text-ink-muted">Meters rowed per week</p>
                  <div className="mt-2">
                    <WeeklyVolumeChart weeks={weeks} />
                  </div>
                </section>
                <section className="rounded-xl border border-hairline bg-surface-1 p-4">
                  <h2 className="text-sm font-semibold text-ink">Split trend</h2>
                  <p className="text-xs text-ink-muted">
                    Avg /500m split per session — higher is faster
                  </p>
                  <div className="mt-2">
                    {trend.length >= 2 ? (
                      <SplitTrendChart points={trend} />
                    ) : (
                      <div className="flex h-[220px] items-center justify-center text-sm text-ink-muted">
                        Log at least two sessions to see a trend.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="mt-4">
                <h2 className="mb-2 text-sm font-semibold text-ink">Sessions</h2>
                <SessionTable
                  sessions={filtered}
                  onDelete={(id) => update(sessions.filter((s) => s.id !== id))}
                />
              </section>
            </>
          )}
        </>
      )}

      <footer className="mt-10 text-center text-xs text-ink-muted">
        Data is stored locally in your browser.
      </footer>
    </main>
  );
}
