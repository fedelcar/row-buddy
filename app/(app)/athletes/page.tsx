import Link from "next/link";
import { getAthletes, getAllPersonalBests } from "@/lib/queries";
import { formatSplit } from "@/lib/format";
import { Card, Chip, EmptyState, PageHeader } from "@/components/ui";
import { SIDE_LABEL } from "@/lib/domain";

export const metadata = { title: "Athletes — Row Buddy" };

export default async function AthletesPage() {
  const [athletes, pbs] = await Promise.all([getAthletes(true), getAllPersonalBests("2k")]);
  const active = athletes.filter((a) => a.active);
  const inactive = athletes.filter((a) => !a.active);

  return (
    <main className="space-y-4">
      <PageHeader
        title="Athletes"
        subtitle={active.length > 0 ? `${active.length} on the squad` : undefined}
        action={{ href: "/athletes/new", label: "+ Add athlete" }}
      />
      {athletes.length === 0 ? (
        <EmptyState
          title="No athletes yet"
          body="Add your first athlete to start logging erg tests and sessions for them."
          action={{ href: "/athletes/new", label: "+ Add athlete" }}
        />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-(--border-hairline)">
              {active.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/athletes/${a.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-series-1-wash"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{a.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {a.ageGroup && <Chip>{a.ageGroup}</Chip>}
                        {a.side && <Chip>{SIDE_LABEL[a.side]}</Chip>}
                        {a.weightClass && <Chip>{a.weightClass}</Chip>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {pbs.get(a.id) ? (
                        <>
                          <div className="text-sm font-semibold text-ink tabular-nums">
                            {formatSplit(pbs.get(a.id)!)}
                          </div>
                          <div className="text-xs text-ink-muted">2k PB /500m</div>
                        </>
                      ) : (
                        <span className="text-xs text-ink-muted">No 2k yet</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          {inactive.length > 0 && (
            <details className="px-1">
              <summary className="cursor-pointer text-sm text-ink-muted">
                Inactive ({inactive.length})
              </summary>
              <Card className="mt-2">
                <ul className="divide-y divide-(--border-hairline)">
                  {inactive.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/athletes/${a.id}`}
                        className="block px-4 py-3 text-ink-secondary hover:text-ink"
                      >
                        {a.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </details>
          )}
        </>
      )}
    </main>
  );
}
