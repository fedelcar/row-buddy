import Link from "next/link";
import {
  getAthletes,
  getSessions,
  improvements,
  leaderboard,
  weeklyTeamVolume,
} from "@/lib/queries";
import { SESSION_TYPE_LABEL, TEST_TYPES, type TestType } from "@/lib/domain";
import {
  formatDateLong,
  formatDateShort,
  formatErgTime,
  formatMeters,
  formatSplit,
} from "@/lib/format";
import { btnGhost, btnPrimary, Card, EmptyState, PageHeader } from "@/components/ui";
import { WeeklyVolumeChart } from "@/components/WeeklyVolumeChart";

export const metadata = { title: "Dashboard — Row Buddy" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const { board } = await searchParams;
  const boardType: TestType = (TEST_TYPES as readonly string[]).includes(board ?? "")
    ? (board as TestType)
    : "2k";

  const [athletes, entries, movers, weeks, recent] = await Promise.all([
    getAthletes(),
    leaderboard(boardType),
    improvements(boardType),
    weeklyTeamVolume(12),
    getSessions(5),
  ]);

  if (athletes.length === 0) {
    return (
      <main className="space-y-4">
        <PageHeader title="Welcome to Row Buddy" subtitle="The team logbook, out of the notebook." />
        <EmptyState
          title="Let's set up the squad"
          body="Add your athletes first — then every erg test, outing, and personal best lives here."
          action={{ href: "/athletes/new", label: "+ Add your first athlete" }}
        />
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />
      <div className="flex flex-wrap gap-2">
        <Link href="/tests/new" className={btnPrimary}>
          + Log erg test
        </Link>
        <Link href="/sessions/new" className={btnGhost}>
          + Log session
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">Fastest right now</h2>
              <p className="text-xs text-ink-muted">Best {boardType} per athlete, by avg /500m</p>
            </div>
            <div className="flex gap-1 rounded-lg border border-hairline p-0.5">
              {TEST_TYPES.map((t) => (
                <Link
                  key={t}
                  href={t === "2k" ? "/" : `/?board=${t}`}
                  aria-current={t === boardType ? "true" : undefined}
                  className={`rounded-md px-2.5 py-1 text-xs ${
                    t === boardType
                      ? "bg-accent font-medium text-accent-ink"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">
              No {boardType} tests yet —{" "}
              <Link href="/tests/new" className="text-accent hover:underline">
                log the first one
              </Link>
              .
            </p>
          ) : (
            <ol className="mt-3 divide-y divide-(--border-hairline)">
              {entries.slice(0, 8).map(({ athlete, best }, i) => (
                <li key={athlete.id}>
                  <Link
                    href={`/athletes/${athlete.id}`}
                    className="flex items-center gap-3 px-1 py-2.5 hover:bg-series-1-wash"
                  >
                    <span
                      className={`w-6 text-center text-sm tabular-nums ${
                        i === 0 ? "font-bold text-ink" : "text-ink-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{athlete.name}</span>
                    <span className="text-sm font-semibold text-ink tabular-nums">
                      {formatSplit(best.splitSeconds)}
                    </span>
                    <span className="hidden w-20 text-right text-xs text-ink-muted tabular-nums sm:block">
                      {boardType === "30min"
                        ? `${best.distanceMeters.toLocaleString("en-US")} m`
                        : formatErgTime(best.timeSeconds)}
                    </span>
                    <span className="w-14 text-right text-xs text-ink-muted">
                      {formatDateShort(best.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Who&apos;s improving</h2>
          <p className="text-xs text-ink-muted">
            Last two {boardType} tests compared, seconds per 500m
          </p>
          {movers.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">
              Needs two tests per athlete — keep logging and this fills in.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-(--border-hairline)">
              {movers.slice(0, 8).map(({ athlete, latest, deltaSeconds }) => (
                <li key={athlete.id}>
                  <Link
                    href={`/athletes/${athlete.id}`}
                    className="flex items-center gap-3 px-1 py-2.5 hover:bg-series-1-wash"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{athlete.name}</span>
                    <span className="text-xs text-ink-muted tabular-nums">
                      now {formatSplit(latest.splitSeconds)}
                    </span>
                    <span
                      className={`w-16 text-right text-sm font-semibold tabular-nums ${
                        deltaSeconds >= 0 ? "text-delta-good" : "text-delta-bad"
                      }`}
                    >
                      {deltaSeconds >= 0 ? "▲" : "▼"} {Math.abs(deltaSeconds).toFixed(1)}s
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {weeks.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Team volume</h2>
          <p className="text-xs text-ink-muted">Meters across all sessions, per week</p>
          <div className="mt-2">
            <WeeklyVolumeChart weeks={weeks} />
          </div>
        </Card>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Recent sessions</h2>
          <Link href="/sessions" className="text-sm text-accent hover:underline">
            All sessions
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-ink-secondary">
            Nothing logged yet — the latest outings will show here.
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-(--border-hairline)">
              {recent.map(({ session, athletes: crew }) => (
                <li key={session.id} className="px-4 py-3">
                  <div className="text-sm text-ink">
                    {SESSION_TYPE_LABEL[session.type]}
                    {session.distanceMeters ? ` · ${formatMeters(session.distanceMeters)} m` : ""}
                    {crew.length > 0 &&
                      ` · ${crew.length} ${crew.length === 1 ? "athlete" : "athletes"}`}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {formatDateLong(session.date)}
                    {session.notes ? ` — ${session.notes}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </main>
  );
}
