"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  price: number;
  durationMinutes: number;
  capacity: number | null;
};

type BoardVariant = {
  id: string;
  label: string;
  category: { id: string; name: string };
};

type WetsuitVariant = {
  id: string;
  label: string;
  category: { id: string; name: string };
};

type SchoolData = {
  business: {
    name: string;
    slug: string;
    timezone: string;
    currency: string;
    canAcceptPayments: boolean;
    onlineBookingEnabled?: boolean;
    onlineBookingMessage?: string | null;
  };
  lessons: Lesson[];
  boardVariants: BoardVariant[];
  wetsuitVariants: WetsuitVariant[];
  hasInstructors: boolean;
};

type Slot = {
  start: string;
  end: string;
  instructorId: string | null;
};

function TimeScrollPickers({
  slots,
  selectedSlot,
  onSelectSlot,
  timezone,
}: {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
  timezone: string;
}) {
  const slotByTime = new Map<string, Slot>();
  const hourSet = new Set<number>();
  const minuteSet = new Set<number>();
  for (const s of slots) {
    const d = new Date(s.start);
    const h = parseInt(d.toLocaleString("en-CA", { hour: "numeric", hour12: false, timeZone: timezone }), 10);
    const m = parseInt(d.toLocaleString("en-CA", { minute: "2-digit", timeZone: timezone }), 10);
    const key = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slotByTime.set(key, s);
    hourSet.add(h);
    minuteSet.add(m);
  }
  const hours = Array.from(hourSet).sort((a, b) => a - b);
  const minutes = Array.from(minuteSet).sort((a, b) => a - b);

  const selectedHour = selectedSlot
    ? parseInt(new Date(selectedSlot.start).toLocaleString("en-CA", { hour: "numeric", hour12: false, timeZone: timezone }), 10)
    : null;
  const selectedMinute = selectedSlot
    ? parseInt(new Date(selectedSlot.start).toLocaleString("en-CA", { minute: "2-digit", timeZone: timezone }), 10)
    : null;

  function handlePick(h: number, m: number) {
    const key = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const s = slotByTime.get(key);
    if (s) onSelectSlot(s);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-2 rounded-md border border-input p-2">
        <div className="flex flex-1 flex-col">
          <span className="mb-1 text-center text-xs font-medium text-muted-foreground">Hour</span>
          <div
            className="max-h-32 overflow-y-auto rounded bg-muted/50"
            style={{ scrollbarWidth: "thin", msOverflowStyle: "scrollbar" }}
          >
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handlePick(h, selectedMinute ?? minutes[0] ?? 0)}
                className={`block w-full px-3 py-2 text-center text-sm transition-colors hover:bg-muted ${
                  selectedHour === h ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {String(h).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <span className="mb-1 text-center text-xs font-medium text-muted-foreground">Min</span>
          <div
            className="max-h-32 overflow-y-auto rounded bg-muted/50"
            style={{ scrollbarWidth: "thin", msOverflowStyle: "scrollbar" }}
          >
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handlePick(selectedHour ?? hours[0] ?? 7, m)}
                className={`block w-full px-3 py-2 text-center text-sm transition-colors hover:bg-muted ${
                  selectedMinute === m ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Times in {timezone}
        {selectedSlot && (
          <> • {new Date(selectedSlot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: timezone })}</>
        )}
      </p>
    </div>
  );
}

export function PublicBookingForm({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SchoolData | null>(null);

  const [lessonId, setLessonId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [participants, setParticipants] = useState(1);
  const [boardVariantId, setBoardVariantId] = useState("");
  const [wetsuitVariantId, setWetsuitVariantId] = useState("");
  const [payLater, setPayLater] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/schools/${businessSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [businessSlug]);

  const canFetchSlots = !!(lessonId && date && data?.hasInstructors);
  const displaySlots = canFetchSlots ? slots : [];
  const displaySlot = canFetchSlots ? slot : null;

  useEffect(() => {
    if (!canFetchSlots) return;
    queueMicrotask(() => setSlotsLoading(true));
    fetch(
      `/api/public/schools/${businessSlug}/slots?lessonId=${encodeURIComponent(lessonId)}&date=${encodeURIComponent(date)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSlots(d.slots ?? []);
        setSlot(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load slots");
        setSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [businessSlug, lessonId, date, canFetchSlots]);

  const selectedLesson = data?.lessons.find((l) => l.id === lessonId);
  const minDate = new Date().toISOString().slice(0, 10);

  function canAdvance() {
    if (step === 1) return !!lessonId && !!date && !!displaySlot;
    if (step === 2)
      return (
        firstName.trim() &&
        lastName.trim() &&
        boardVariantId &&
        wetsuitVariantId &&
        participants >= 1
      );
    return false;
  }

  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    idempotencyKeyRef.current = null;
  }, [slot]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !selectedLesson || !data) return;
    setError(null);
    setSubmitting(true);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const res = await fetch(`/api/public/schools/${businessSlug}/bookings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lessonId,
          startAt: slot.start,
          endAt: slot.end,
          instructorId: slot.instructorId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          participants,
          boardVariantId,
          wetsuitVariantId,
          payLater,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const payload = (await res.json().catch(() => null)) as {
        booking?: { id: string };
        error?: string;
      };

      if (!res.ok) {
        setError(payload?.error ?? "Failed to create booking");
        setSubmitting(false);
        return;
      }

      const id = payload.booking?.id;
      if (!id) {
        setError("Invalid response from server");
        setSubmitting(false);
        return;
      }

      setBookingId(id);

      if (data.business.canAcceptPayments && !payLater) {
        const checkoutRes = await fetch(
          `/api/public/schools/${businessSlug}/checkout`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ bookingId: id }),
          }
        );
        const checkoutData = (await checkoutRes.json().catch(() => null)) as {
          url?: string;
          error?: string;
        };
        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
          return;
        }
        setError(checkoutData?.error ?? "Failed to start payment");
        setSubmitting(false);
        return;
      }

      router.push(`/book/${businessSlug}/confirmation?bookingId=${id}`);
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.business.onlineBookingEnabled === false) {
    const msg =
      data.business.onlineBookingMessage?.trim() ||
      "Online booking is currently unavailable. Please contact the school to book.";
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground whitespace-pre-wrap">{msg}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.hasInstructors) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            {data.business.name} has not set up instructors yet. Online booking
            is not available. Please contact them directly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.lessons.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            No lessons available for booking yet. Please check back later or
            contact {data.business.name} directly.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasBoardAndWetsuit =
    data.boardVariants.length > 0 && data.wetsuitVariants.length > 0;
  if (!hasBoardAndWetsuit) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Equipment is not fully set up for online booking. Please contact{" "}
            {data.business.name} directly to book.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = data.business.currency ?? "NZD";
  const currencySymbol = currency === "NZD" ? "NZ$" : currency === "AUD" ? "A$" : "$";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Lesson + Date + Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Choose lesson & time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Lesson</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={lessonId}
              onChange={(e) => {
                setLessonId(e.target.value);
                setSlot(null);
              }}
              required
            >
              <option value="">Select a lesson</option>
              {data.lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} – {currencySymbol}
                  {l.price.toFixed(2)} ({l.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot(null);
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              Dates and times are in {data.business.timezone ?? "Pacific/Auckland"} (school&apos;s local time).
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Time</Label>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading available slots…
              </div>
            ) : displaySlots.length === 0 && canFetchSlots ? (
              <p className="text-sm text-muted-foreground">
                No slots available for this date. Try another date.
              </p>
            ) : (
              <TimeScrollPickers
                slots={displaySlots}
                selectedSlot={displaySlot}
                onSelectSlot={setSlot}
                timezone={data?.business?.timezone ?? "Pacific/Auckland"}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Your details + Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Your details & equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+64 21 123 4567"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="participants">Participants *</Label>
            <Input
              id="participants"
              type="number"
              min={1}
              max={selectedLesson?.capacity ?? 20}
              value={participants}
              onChange={(e) =>
                setParticipants(Math.max(1, Math.trunc(Number(e.target.value) || 1)))
              }
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Board size *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={boardVariantId}
                onChange={(e) => setBoardVariantId(e.target.value)}
                required
              >
                <option value="">Select board</option>
                {data.boardVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.category.name} {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Wetsuit size *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={wetsuitVariantId}
                onChange={(e) => setWetsuitVariantId(e.target.value)}
                required
              >
                <option value="">Select wetsuit</option>
                {data.wetsuitVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {data.business.canAcceptPayments && (
            <div className="grid gap-2">
              <Label>Payment</Label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={!payLater}
                    onChange={() => setPayLater(false)}
                    className="size-4"
                  />
                  <span>Pay now (card)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={payLater}
                    onChange={() => setPayLater(true)}
                    className="size-4"
                  />
                  <span>Pay on arrival</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedLesson && displaySlot && (
            <span>
              {selectedLesson.title} × {participants} ={" "}
              <strong>
                {currencySymbol}
                {(selectedLesson.price * participants).toFixed(2)}
              </strong>
            </span>
          )}
        </div>
        <Button
          type="submit"
          disabled={!canAdvance() || submitting}
          className="min-w-[140px]"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Booking…
            </>
          ) : (
            "Confirm booking"
          )}
        </Button>
      </div>
    </form>
  );
}
