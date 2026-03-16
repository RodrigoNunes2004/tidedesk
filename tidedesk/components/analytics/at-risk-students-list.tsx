"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AtRiskStudent } from "@/modules/analytics";
import { Mail } from "lucide-react";

type Props = {
  students: AtRiskStudent[];
};

function buildMailtoLink(students: AtRiskStudent[]): string {
  const emails = students
    .map((s) => s.email)
    .filter((e): e is string => Boolean(e?.trim()));
  if (emails.length === 0) return "";
  const subject = encodeURIComponent("We miss you! Book your next surf lesson");
  const body = encodeURIComponent(
    "Hi,\n\nWe'd love to see you back at the waves! Book your next lesson with us.\n\nCheers"
  );
  return `mailto:${emails.join(",")}?subject=${subject}&body=${body}`;
}

export function AtRiskStudentsList({ students }: Props) {
  const mailto = buildMailtoLink(students);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">At-risk students</CardTitle>
            <p className="text-sm text-muted-foreground">
              No booking in 90 days · Send a promotion to bring them back
            </p>
          </div>
          {students.length > 0 && mailto && (
            <Button asChild size="sm" className="min-h-[44px] shrink-0">
              <a href={mailto} target="_blank" rel="noopener noreferrer">
                <Mail className="mr-2 size-4" />
                Send promotion
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No at-risk students. Everyone has booked recently.
          </p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => (
              <li
                key={s.customerId}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="font-medium">{s.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  Last session {s.daysSinceLastSession} days ago
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
