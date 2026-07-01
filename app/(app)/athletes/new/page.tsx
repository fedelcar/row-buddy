import { PageHeader, Card } from "@/components/ui";
import { AthleteForm } from "@/components/AthleteForm";

export const metadata = { title: "Add athlete — Row Buddy" };

export default function NewAthletePage() {
  return (
    <main className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Add athlete" subtitle="Only the name is required — fill in the rest whenever." />
      <Card className="p-4 sm:p-5">
        <AthleteForm />
      </Card>
    </main>
  );
}
