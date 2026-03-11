"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LessonForEdit = {
  id: string;
  title: string;
  price: number | string;
  depositAmount?: number | string | null;
  capacity: number | null;
  durationMinutes: number;
};

type CreateEditLessonDialogProps = {
  lesson?: LessonForEdit | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateEditLessonDialog({
  lesson,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CreateEditLessonDialogProps) {
  const router = useRouter();
  const isEdit = !!lesson?.id;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [capacity, setCapacity] = useState("");

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const setIsOpen = isControlled && onOpenChange ? onOpenChange : setOpen;

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setPrice(String(lesson.price));
      setDepositAmount(lesson.depositAmount != null && lesson.depositAmount !== "" ? String(lesson.depositAmount) : "");
      setDurationMinutes(String(lesson.durationMinutes ?? 60));
      setCapacity(lesson.capacity != null ? String(lesson.capacity) : "");
    } else {
      setTitle("");
      setPrice("");
      setDepositAmount("");
      setDurationMinutes("60");
      setCapacity("");
    }
  }, [lesson, isOpen]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const priceNum = Number(price);
    const depositNum = depositAmount.trim() ? Number(depositAmount) : null;
    const durationNum = Math.trunc(Number(durationMinutes)) || 60;
    const capacityVal = capacity.trim() ? Math.trunc(Number(capacity)) : null;

    if (depositNum !== null && (depositNum < 0 || depositNum > priceNum)) {
      setError("Deposit must be between 0 and the lesson price.");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      setLoading(false);
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Enter a valid price.");
      setLoading(false);
      return;
    }
    if (durationNum < 15 || durationNum > 480) {
      setError("Duration must be between 15 and 480 minutes.");
      setLoading(false);
      return;
    }
    if (capacityVal !== null && (capacityVal < 0 || !Number.isFinite(capacityVal))) {
      setError("Capacity must be a non-negative number.");
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            price: priceNum,
            depositAmount: depositNum,
            durationMinutes: durationNum,
            capacity: capacityVal,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? "Failed to update lesson.");
          return;
        }
      } else {
        const res = await fetch("/api/lessons", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            price: priceNum,
            depositAmount: depositNum,
            durationMinutes: durationNum,
            capacity: capacityVal,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? "Failed to create lesson.");
          return;
        }
      }
      setIsOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit lesson" : "Add lesson type"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the lesson type. Changes apply to future bookings."
            : "Add a new lesson type (e.g. Beginner, Intermediate, Kids, Over 60)."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="lesson-title">Title *</Label>
          <Input
            id="lesson-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Beginner, Kids, Over 60"
            required
          />
        </div>
          <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lesson-price">Price (per person) *</Label>
            <Input
              id="lesson-price"
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-deposit">Deposit (optional, Pro)</Label>
            <Input
              id="lesson-deposit"
              type="number"
              min={0}
              step={0.01}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 20 for pay now, rest at beach"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lesson-duration">Duration (min) *</Label>
            <Input
              id="lesson-duration"
              type="number"
              min={15}
              max={480}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="60"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-capacity">Capacity (optional)</Label>
            <Input
              id="lesson-capacity"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave empty for no limit"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {content}
    </Dialog>
  );
}
