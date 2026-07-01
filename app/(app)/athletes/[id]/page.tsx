import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAthlete,
  getAthleteSessionResults,
  getAthleteTests,
  personalBests,
} from "@/lib/queries";
import { SESSION_TYPE_LABEL, SIDE_LABEL, TEST_TYPES, type TestType } from "@/lib/domain";
import { deleteErgTest } from "@/app/actions/tests";
import {
  formatDateLong,
  formatDateShort,
  formatDuration,
  formatErgTime,
  formatMeters,
  formatSplit,
} from "@/lib/format";
import { btnGhost, btnPrimary, Card, Chip, PageHeader } from "@/components/ui";
import { StatTile } from "@/components/StatTile";
import { SplitTrendChart } from "@/components/SplitTrendChart";

export default async function AthletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ newpb?: string; chart?: string }>;
}) {
  const [{ id }, { newpb, chart }] = await Promise.all([params, searchParams]);
  const athleteId = Number(id);
  const athlete = await getAthlete(athleteId);
  if (!athlete) notFound();

  const [tests, sessionRows] = await Promise.all([
    getAthleteTests(athleteId),
    getAthleteSessionResults(athleteId),
  ]);
  const pbs = personalBests(tests);

  const typesWithData = TEST_TYPES.filter((t) => tests.some((x) => x.testType === t));
  const chartType: TestType | undefined =
    typesWithData.find((t) => t === chart) ??
    (typesWithData.length > 0
      ? typesWithData.reduce((a, b) =>
          tests.filter((t) => t.testType === b).length > tests.filter((t) => t.testType === a).length
            ? b
            : a,
        )
      : undefined);
  const chartPoints = chartType
    ? tests
        .filter((t) => t.testType === chartType)
        .map((t) => ({
          id: t.id,
          date: t.date,
          split: t.splitSeconds,
          detail:
            t.testType === "30min"
              ? `30min · ${t.distanceMeters.toLocaleString("en-US")} m`
              : `${t.testType} · ${formatErgTime(t.timeSeconds)}`,
        }))
        .reverse()
    : [];

  return (
    <main className="space-y-4">
      {newpb && (
        <div className="rounded-xl border border-hairline bg-series-1-wash px-4 py-3 text-sm font-medium text-ink">
          🎉 New personal best for {athlete.name} — nice one!
        </div>
      )}
      <PageHeader title={athlete.name} />
      <div className="flex flex-wrap items-center gap-1.5">
        {!athlete.active && <Chip>Inactive</Chip>}
        {athlete.ageGroup && <Chip>{athlete.ageGroup}</Chip>}
        {athlete.side && <Chip>{SIDE_LABEL[athlete.side]}</Chip>}
        {athlete.weightClass && <Chip>{athlete.weightClass}</Chip>}
        <Link href={`/athletes/${athlete.id}/edit`} className="text-sm text-accent hover:underline">
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/tests/new?athlete=${athlete.id}`} className={btnPrimary}>
          + Log erg test
        </Link>
        <Link href="/sessions/new" className={btnGhost}>
          + Log session
        </Link>
      </div>

      {tests.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TEST_TYPES.map((t) => {
            const pb = pbs[t];
            return (
              <StatTile
                key={t}
                label={`${t} PB`}
                value={pb ? formatSplit(pb.splitSeconds) : "—"}
                detail={
                  pb
                    ? t === "30min"
                      ? `${pb.distanceMeters.toLocaleString("en-US")} m · ${formatDateShort(pb.date)}`
                      : `${formatErgTime(pb.timeSeconds)} · ${formatDateShort(pb.date)}`
                    : "no test yet"
                }
              />
            );
          })}
        </div>
      )}

      {chartType && chartPoints.length >= 2 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">Progress — {chartType} split</h2>
              <p className="text-xs text-ink-muted">Avg /500m per test — higher is faster</p>
            </div>
            {typesWithData.length > 1 && (
              <div className="flex gap-1 rounded-lg border border-hairline p-0.5">
                {typesWithData.map((t) => (
                  <Link
                    key={t}
                    href={`/athletes/${athlete.id}?chart=${t}`}
                    aria-current={t === chartType ? "true" : undefined}
                    className={`rounded-md px-2.5 py-1 text-xs ${
                      t === chartType
                        ? "bg-accent font-medium text-accent-ink"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2">
            <SplitTrendChart points={chartPoints} />
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Erg tests</h2>
        {tests.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-ink-secondary">
            No tests yet — log a 2k and the progress chart appears here.
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-ink-muted">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Test</th>
                  <th className="px-4 py-2.5 text-right font-medium">Result</th>
                  <th className="px-4 py-2.5 text-right font-medium">Split /500m</th>
                  <th className="px-4 py-2.5 text-right font-medium">SPM</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Notes</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => {
                  const isPb = pbs[t.testType]?.id === t.id;
                  return (
                    <tr key={t.id} className="border-b border-hairline last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                        {formatDateShort(t.date)}
                      </td>
                      <td className="px-4 py-2.5 text-ink-secondary">
                        {t.testType}
                        {isPb && (
                          <span className="ml-1.5 rounded bg-series-1-wash px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                            PB
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink tabular-nums">
                        {t.testType === "30min"
                          ? `${t.distanceMeters.toLocaleString("en-US")} m`
                          : formatErgTime(t.timeSeconds)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                        {formatSplit(t.splitSeconds)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-secondary tabular-nums">
                        {t.strokeRate ?? "—"}
                      </td>
                      <td className="hidden max-w-48 truncate px-4 py-2.5 text-ink-secondary md:table-cell">
                        {t.notes ?? ""}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <form action={deleteErgTest}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="athleteId" value={athlete.id} />
                          <button
                            type="submit"
                            aria-label={`Delete ${t.testType} test on ${formatDateLong(t.date)}`}
                            className="rounded px-2 py-1 text-xs text-ink-muted hover:text-delta-bad"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Recent sessions</h2>
        {sessionRows.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-ink-secondary">
            No sessions logged for {athlete.name} yet.
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-(--border-hairline)">
              {sessionRows.slice(0, 10).map(({ result, session }) => (
                <li key={result.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm text-ink">
                      {SESSION_TYPE_LABEL[session.type]}
                      {session.distanceMeters
                        ? ` · ${formatMeters(session.distanceMeters)} m`
                        : ""}
                    </div>
                    <div className="text-xs text-ink-muted">{formatDateLong(session.date)}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm text-ink-secondary tabular-nums">
                    {result.splitSeconds
                      ? `${formatSplit(result.splitSeconds)} /500m`
                      : result.timeSeconds
                        ? formatDuration(result.timeSeconds)
                        : ""}
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
