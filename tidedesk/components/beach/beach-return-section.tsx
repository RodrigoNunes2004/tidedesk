"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Rental = {
  id: string;
  startAt: Date;
  quantity: number;
  customer: { firstName: string; lastName: string };
  equipmentLabel: string;
  status: string;
};

export function BeachReturnSection({ rentals }: { rentals: Rental[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markReturned(rentalId: string) {
    setLoadingId(rentalId);
    const res = await fetch(`/api/rentals/${rentalId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "RETURNED" }),
    });
    setLoadingId(null);
    if (res.ok) router.refresh();
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Return equipment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Active rentals
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {rentals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No active rentals
          </p>
        ) : (
          rentals.map((r) => {
            const isLoading = loadingId === r.id;
            const label = `${r.customer.firstName} ${r.customer.lastName} · ${r.equipmentLabel}${r.quantity > 1 ? ` ×${r.quantity}` : ""}`;

            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  {r.status === "OVERDUE" && (
                    <p className="text-xs text-destructive">Overdue</p>
                  )}
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="beach-action-btn min-h-14 shrink-0 px-8 text-base font-semibold"
                  onClick={() => markReturned(r.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Return"
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
