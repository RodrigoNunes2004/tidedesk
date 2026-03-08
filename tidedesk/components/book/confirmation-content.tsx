"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

type Props = {
  businessSlug: string;
  bookingId?: string;
  sessionId?: string;
};

type ConfirmationData = {
  booking: {
    id: string;
    startAt: string;
    endAt: string;
    participants: number;
    status: string;
  };
  lesson: { title: string; price: number; durationMinutes: number } | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  paid: boolean;
};

export function ConfirmationContent({
  businessSlug,
  bookingId,
  sessionId,
}: Props) {
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasParams = !!(bookingId || sessionId);

  useEffect(() => {
    if (!hasParams) return;
    const q = new URLSearchParams();
    if (bookingId) q.set("bookingId", bookingId);
    if (sessionId) q.set("session_id", sessionId);
    fetch(`/api/public/schools/${businessSlug}/confirmation?${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load confirmation")
      );
  }, [businessSlug, bookingId, sessionId, hasParams]);

  if (!hasParams || error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            {!hasParams ? "No booking or session provided" : error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  const start = new Date(data.booking.startAt);
  const end = new Date(data.booking.endAt);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {data.lesson?.title ?? "Lesson"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {data.customer.firstName} {data.customer.lastName}
              </p>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">
                  {start.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Time</dt>
                <dd className="font-medium">
                  {start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {end.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Participants</dt>
                <dd className="font-medium">{data.booking.participants}</dd>
              </div>
              {data.lesson && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-medium">
                    NZ${(data.lesson.price * data.booking.participants).toFixed(2)}
                    {data.paid && (
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        (Paid)
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
            {data.customer.email && (
              <p className="text-xs text-muted-foreground">
                A confirmation has been sent to {data.customer.email}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
