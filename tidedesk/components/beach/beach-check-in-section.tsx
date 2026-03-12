"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Booking = {
  id: string;
  startAt: Date;
  customer: { firstName: string; lastName: string };
  lesson: { title: string; durationMinutes: number | null } | null;
};

export function BeachCheckInSection({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function checkIn(bookingId: string) {
    setLoadingId(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "CHECKED_IN" }),
    });
    setLoadingId(null);
    if (res.ok) router.refresh();
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Check in</CardTitle>
        <p className="text-sm text-muted-foreground">
          Today&apos;s bookings
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No bookings to check in
          </p>
        ) : (
          bookings.map((b) => {
            const isLoading = loadingId === b.id;
            const time = new Date(b.startAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const label = `${b.customer.firstName} ${b.customer.lastName} · ${b.lesson?.title ?? "—"} ${time}`;

            return (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
                <Button
                  size="lg"
                  className="beach-action-btn min-h-14 shrink-0 px-8 text-base font-semibold"
                  onClick={() => checkIn(b.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Check in"
                  )}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
