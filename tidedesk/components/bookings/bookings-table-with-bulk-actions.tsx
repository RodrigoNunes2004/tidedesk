"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/currency";
import { formatInBusinessTimezone } from "@/lib/lesson-hours";
import { CancelBookingButton, CompleteBookingButton, NoShowBookingButton } from "@/components/bookings/booking-actions";
import { CheckInBookingDialog } from "@/components/bookings/check-in-booking-dialog";
import { PayBookingButton } from "@/components/bookings/pay-booking-button";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  startAt: Date | string;
  endAt: Date | string;
  status: BookingStatus;
  participants: number;
  depositPaid?: unknown;
  balanceRemaining?: unknown;
  rental: { id: string } | null;
  lesson: { title: string; durationMinutes: number | null; price: unknown; depositAmount?: unknown } | null;
  customer: { firstName: string; lastName: string };
  instructor: { firstName: string; lastName: string } | null;
  payments?: { id: string }[];
};

type Props = {
  bookings: Booking[];
  business: {
    chargesEnabled?: boolean;
    stripeAccountId?: string | null;
    currency?: string | null;
    timezone?: string | null;
  } | null;
  now: Date;
};

function statusBadge(status: BookingStatus) {
  if (status === BookingStatus.CANCELLED)
    return <Badge variant="secondary">Cancelled</Badge>;
  if (status === BookingStatus.NO_SHOW)
    return <Badge variant="secondary">No-show</Badge>;
  if (status === BookingStatus.CHECKED_IN)
    return <Badge variant="secondary">Checked in</Badge>;
  if (status === BookingStatus.COMPLETED)
    return <Badge variant="secondary">Completed</Badge>;
  return <Badge>Booked</Badge>;
}

export function BookingsTableWithBulkActions({
  bookings,
  business,
  now,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<"CANCELLED" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW" | null>(null);

  const allIds = new Set(bookings.map((b) => b.id));
  const cancelableIds = new Set(
    bookings
      .filter((b) => b.status === BookingStatus.BOOKED && new Date(b.startAt) > now)
      .map((b) => b.id)
  );
  const canCheckInIds = new Set(
    bookings
      .filter((b) => b.status === BookingStatus.BOOKED && !b.rental)
      .map((b) => b.id)
  );
  const checkedInIds = new Set(
    bookings
      .filter((b) => b.status === BookingStatus.CHECKED_IN)
      .map((b) => b.id)
  );
  const completedIds = new Set(
    bookings
      .filter((b) => b.status === BookingStatus.COMPLETED)
      .map((b) => b.id)
  );
  const allSelected = allIds.size > 0 && selected.size === allIds.size;
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function selectAll() {
    setSelected(new Set(allIds));
  }
  function selectCancelable() {
    setSelected(new Set(cancelableIds));
  }
  function selectCanCheckIn() {
    setSelected(new Set(canCheckInIds));
  }
  function selectCheckedIn() {
    setSelected(new Set(checkedInIds));
  }
  function selectCompleted() {
    setSelected(new Set(completedIds));
  }

  function getEligibleForAction(action: "CANCELLED" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW"): string[] {
    return bookings
      .filter((b) => {
        if (!selected.has(b.id)) return false;
        if (action === "CANCELLED")
          return b.status === BookingStatus.BOOKED && new Date(b.startAt) > now;
        if (action === "CHECKED_IN")
          return b.status === BookingStatus.BOOKED && !b.rental;
        if (action === "COMPLETED")
          return b.status === BookingStatus.CHECKED_IN;
        if (action === "NO_SHOW")
          return b.status === BookingStatus.BOOKED && new Date(b.startAt) > now;
        return false;
      })
      .map((b) => b.id);
  }

  async function runBulkAction(action: "CANCELLED" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW") {
    const ids = getEligibleForAction(action);
    if (ids.length === 0) return;

    setBulkLoading(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: action }),
          })
        )
      );
      setSelected(new Set());
      setBulkAction(null);
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  const canCancelCount = getEligibleForAction("CANCELLED").length;
  const canCheckInCount = getEligibleForAction("CHECKED_IN").length;
  const canCompleteCount = getEligibleForAction("COMPLETED").length;
  const canNoShowCount = getEligibleForAction("NO_SHOW").length;

  return (
    <>
      {/* Quick select + bulk actions bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium">Quick select:</span>
        <Button variant="ghost" size="sm" onClick={selectAll}>
          All on page
        </Button>
        {cancelableIds.size > 0 && (
          <Button variant="ghost" size="sm" onClick={selectCancelable}>
            All that can cancel ({cancelableIds.size})
          </Button>
        )}
        {canCheckInIds.size > 0 && (
          <Button variant="ghost" size="sm" onClick={selectCanCheckIn}>
            All that can check in ({canCheckInIds.size})
          </Button>
        )}
        {checkedInIds.size > 0 && (
          <Button variant="ghost" size="sm" onClick={selectCheckedIn}>
            All checked-in ({checkedInIds.size})
          </Button>
        )}
        {completedIds.size > 0 && (
          <Button variant="ghost" size="sm" onClick={selectCompleted}>
            All completed ({completedIds.size})
          </Button>
        )}
      </div>

      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          {canCancelCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => setBulkAction("CANCELLED")}
            >
              Cancel ({canCancelCount})
            </Button>
          )}
          {canCheckInCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => setBulkAction("CHECKED_IN")}
            >
              Check in ({canCheckInCount})
            </Button>
          )}
          {canCompleteCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => setBulkAction("COMPLETED")}
            >
              Complete ({canCompleteCount})
            </Button>
          )}
          {canNoShowCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => setBulkAction("NO_SHOW")}
            >
              No-show ({canNoShowCount})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear selection
          </Button>
        </div>
      )}

      <AlertDialog
        open={bulkAction !== null}
        onOpenChange={(open) => !open && setBulkAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "CANCELLED" && `Cancel ${canCancelCount} booking(s)?`}
              {bulkAction === "CHECKED_IN" && `Check in ${canCheckInCount} booking(s)?`}
              {bulkAction === "COMPLETED" && `Mark ${canCompleteCount} as completed?`}
              {bulkAction === "NO_SHOW" && `Mark ${canNoShowCount} as no-show?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "CANCELLED" &&
                "These bookings will be marked as cancelled. History is preserved."}
              {bulkAction === "CHECKED_IN" &&
                "These bookings will be marked as checked in."}
              {bulkAction === "COMPLETED" &&
                "These bookings will be marked as completed."}
              {bulkAction === "NO_SHOW" &&
                "These bookings will be marked as no-show. History is preserved for reporting."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Back</AlertDialogCancel>
            <Button
              disabled={bulkLoading}
              onClick={async () => {
                if (!bulkAction) return;
                await runBulkAction(bulkAction);
              }}
            >
              {bulkLoading ? "Processing..." : "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-w-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-input"
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Lesson</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => {
              const canCancel = b.status === BookingStatus.BOOKED && new Date(b.startAt) > now;
              const canCheckIn = b.status === BookingStatus.BOOKED && !b.rental;
              const canComplete = b.status === BookingStatus.CHECKED_IN;
              const totalAmount = Number(b.lesson?.price ?? 0) * b.participants;
              const depositPaid = Number(b.depositPaid ?? 0);
              const balanceRemaining = Number(b.balanceRemaining ?? totalAmount - depositPaid);
              const isFullyPaid = depositPaid >= totalAmount - 0.01;
              const canPay =
                business?.chargesEnabled &&
                business?.stripeAccountId &&
                b.lesson &&
                !isFullyPaid &&
                (b.status === BookingStatus.BOOKED || b.status === BookingStatus.CHECKED_IN);
              const hasDepositOption = Number(b.lesson?.depositAmount ?? 0) > 0;
              const canPayDeposit = canPay && depositPaid === 0 && hasDepositOption;
              const canPayBalance = canPay && depositPaid > 0 && balanceRemaining > 0.01;

              return (
                <TableRow
                  key={b.id}
                  data-state={selected.has(b.id) ? "selected" : undefined}
                  className={cn(selected.has(b.id) && "bg-muted/50")}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      role="checkbox"
                      aria-label={`Select ${b.customer.firstName} ${b.customer.lastName}`}
                      checked={selected.has(b.id)}
                      onChange={() => toggle(b.id)}
                      className="size-4 rounded border-input"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {b.customer.firstName} {b.customer.lastName}
                  </TableCell>
                  <TableCell>
                    {b.instructor
                      ? `${b.instructor.firstName} ${b.instructor.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {b.lesson?.title ?? "—"}
                    {b.lesson?.durationMinutes
                      ? ` • ${b.lesson.durationMinutes} min`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {formatInBusinessTimezone(b.startAt, business?.timezone)}
                  </TableCell>
                  <TableCell>
                    {formatInBusinessTimezone(b.endAt, business?.timezone)}
                  </TableCell>
                  <TableCell>{b.participants}</TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
                      {canPayBalance ? (
                        <PayBookingButton
                          bookingId={b.id}
                          amount={formatCurrency(balanceRemaining, business?.currency)}
                          paymentType="balance"
                        />
                      ) : canPayDeposit ? (
                        <div className="flex flex-col items-end gap-1">
                          <PayBookingButton
                            bookingId={b.id}
                            amount={formatCurrency(Number(b.lesson!.depositAmount ?? 0) * b.participants, business?.currency)}
                            paymentType="deposit"
                          />
                          <PayBookingButton
                            bookingId={b.id}
                            amount={formatCurrency(totalAmount, business?.currency)}
                            paymentType="full"
                            variant="outline"
                          />
                        </div>
                      ) : canPay ? (
                        <PayBookingButton
                          bookingId={b.id}
                          amount={formatCurrency(totalAmount, business?.currency)}
                        />
                      ) : null}
                      {canCheckIn ? (
                        <CheckInBookingDialog bookingId={b.id} />
                      ) : null}
                      {canComplete ? (
                        <CompleteBookingButton bookingId={b.id} />
                      ) : null}
                      {canCancel ? (
                        <>
                          <CancelBookingButton bookingId={b.id} />
                          <NoShowBookingButton bookingId={b.id} />
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
