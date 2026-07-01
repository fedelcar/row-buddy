import { getAthletes } from "@/lib/queries";
import { Card, PageHeader } from "@/components/ui";
import { SessionForm } from "@/components/SessionForm";

export const metadata = { title: "Log session — Row Buddy" };

export default async function NewSessionPage() {
  const athletes = await getAthletes();

  return (
    <main className="mx-auto max-w-xl space-y-4">
      <PageHeader
        title="Log session"
        subtitle="Only date and type are required — everything else is optional."
      />
      <Card className="p-4 sm:p-5">
        <SessionForm athletes={athletes} />
      </Card>
    </main>
  );
}
