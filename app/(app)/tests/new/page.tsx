import { getAthletes } from "@/lib/queries";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ErgTestForm } from "@/components/ErgTestForm";

export const metadata = { title: "Log erg test — Row Buddy" };

export default async function NewTestPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string }>;
}) {
  const [{ athlete }, athletes] = await Promise.all([searchParams, getAthletes()]);

  if (athletes.length === 0) {
    return (
      <main className="mx-auto max-w-xl">
        <EmptyState
          title="Add an athlete first"
          body="Erg tests belong to an athlete — add one and come back."
          action={{ href: "/athletes/new", label: "+ Add athlete" }}
        />
      </main>
    );
  }

  const defaultAthleteId = athlete ? Number(athlete) : undefined;

  return (
    <main className="mx-auto max-w-xl space-y-4">
      <PageHeader
        title="Log erg test"
        subtitle="The split and personal bests are worked out automatically."
      />
      <Card className="p-4 sm:p-5">
        <ErgTestForm athletes={athletes} defaultAthleteId={defaultAthleteId} />
      </Card>
    </main>
  );
}
