"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateEditLessonDialog } from "@/components/bookings/create-edit-lesson-dialog";

export type LessonRow = {
  id: string;
  title: string;
  durationMinutes: number;
  capacity: number | null;
  price: unknown;
  depositAmount?: unknown;
};

export function LessonsTabContent({ lessons }: { lessons: LessonRow[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this lesson type? Bookings using it will keep the lesson data.")) return;
    const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error ?? "Failed to delete.");
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">Lesson types</div>
          <div className="text-sm text-muted-foreground">
            Define lesson types (Beginner, Kids, Over 60, etc.) with price and duration. Use them when creating bookings.
          </div>
        </div>
        <CreateEditLessonDialog trigger={<Button>Add lesson type</Button>} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All lesson types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell>{l.durationMinutes} min</TableCell>
                    <TableCell>{l.capacity ?? "—"}</TableCell>
                    <TableCell>
                      ${Number(l.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <CreateEditLessonDialog
                          lesson={{
                            id: l.id,
                            title: l.title,
                            price: Number(l.price),
                            depositAmount: l.depositAmount != null ? Number(l.depositAmount) : null,
                            capacity: l.capacity,
                            durationMinutes: l.durationMinutes,
                          }}
                          trigger={<Button variant="outline" size="sm">Edit</Button>}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(l.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {lessons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No lesson types yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
