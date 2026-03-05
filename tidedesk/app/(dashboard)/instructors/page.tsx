import { requireSession } from "@/lib/server/session";
import { InstructorsPageContent } from "@/components/instructors/instructors-page-content";

export default async function InstructorsPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Instructors</h1>
        <p className="text-muted-foreground">
          Manage instructors and assign them to lessons and bookings.
        </p>
      </div>
      <InstructorsPageContent />
    </div>
  );
}
