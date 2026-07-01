import { notFound } from "next/navigation";
import { getAthlete } from "@/lib/queries";
import { Card, PageHeader } from "@/components/ui";
import { AthleteForm } from "@/components/AthleteForm";

export const metadata = { title: "Edit athlete — Row Buddy" };

export default async function EditAthletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athlete = await getAthlete(Number(id));
  if (!athlete) notFound();

  return (
    <main className="mx-auto max-w-xl space-y-4">
      <PageHeader title={`Edit ${athlete.name}`} />
      <Card className="p-4 sm:p-5">
        <AthleteForm athlete={athlete} />
      </Card>
    </main>
  );
}
