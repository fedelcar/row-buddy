import { getSessions } from "@/lib/queries";
import { SESSION_TYPE_LABEL } from "@/lib/domain";
import { deleteSession } from "@/app/actions/sessions";
import { formatDateLong, formatDuration, formatMeters } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Sessions — Row Buddy" };

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <main className="space-y-4">
      <PageHeader
        title="Sessions"
        subtitle="Every outing, erg piece, and gym session."
        action={{ href: "/sessions/new", label: "+ Log session" }}
      />
      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          body="Log the first outing or erg session and it shows up here and on the dashboard."
          action={{ href: "/sessions/new", label: "+ Log session" }}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-(--border-hairline)">
            {sessions.map(({ session, athletes }) => (
              <li key={session.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {SESSION_TYPE_LABEL[session.type]}
                      {session.distanceMeters ? ` · ${formatMeters(session.distanceMeters)} m` : ""}
                      {session.durationSeconds
                        ? ` · ${formatDuration(session.durationSeconds)}`
                        : ""}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {formatDateLong(session.date)}
                      {athletes.length > 0 &&
                        ` · ${athletes.length} ${athletes.length === 1 ? "athlete" : "athletes"}`}
                    </div>
                    {session.notes && (
                      <div className="mt-1 text-sm text-ink-secondary">{session.notes}</div>
                    )}
                    {athletes.length > 0 && (
                      <div className="mt-1 truncate text-xs text-ink-muted">
                        {athletes.map((a) => a.name).join(", ")}
                      </div>
                    )}
                  </div>
                  <form action={deleteSession}>
                    <input type="hidden" name="id" value={session.id} />
                    <button
                      type="submit"
                      aria-label={`Delete session on ${formatDateLong(session.date)}`}
                      className="rounded px-2 py-1 text-xs text-ink-muted hover:text-delta-bad"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
