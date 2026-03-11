"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Webhook, Plus, Trash2 } from "lucide-react";

type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  lastError: string | null;
  createdAt: string;
};

const EVENTS = ["booking.created", "payment.succeeded"] as const;

export function WebhookEndpointsSection() {
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([...EVENTS]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/webhook-endpoints")
      .then((r) => r.json())
      .then((json: { data?: WebhookEndpoint[]; error?: string }) => {
        if (json.error) return;
        setEndpoints(json.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createEndpoint(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/webhook-endpoints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim(), events: selectedEvents }),
      });
      const data = (await res.json()) as { data?: { secret: string }; error?: string };
      if (!res.ok) {
        alert(data.error ?? "Failed to create webhook");
        return;
      }
      if (data.data?.secret) {
        setCreatedSecret(data.data.secret);
        setNewUrl("");
        const listRes = await fetch("/api/webhook-endpoints");
        const list = (await listRes.json()) as { data?: WebhookEndpoint[] };
        if (list.data) setEndpoints(list.data);
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteEndpoint(id: string) {
    const res = await fetch(`/api/webhook-endpoints/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      setDeleteId(null);
      router.refresh();
    } else {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium flex items-center gap-2">
          <Webhook className="size-4" />
          Webhooks
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Receive events (booking.created, payment.succeeded) at your URL. Verify signatures using
          X-TideDesk-Signature (HMAC-SHA256).
        </p>
      </div>

      <form onSubmit={createEndpoint} className="space-y-3">
        <div>
          <Label htmlFor="webhook-url">Endpoint URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-server.com/webhooks/tidedesk"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={creating}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="mb-2 block">Events</Label>
          <div className="flex gap-4">
            {EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(ev)}
                  onChange={(e) =>
                    setSelectedEvents((prev) =>
                      e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev)
                    )
                  }
                />
                <span className="text-sm">{ev}</span>
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={creating || !newUrl.trim()}>
          <Plus className="size-4 mr-1" />
          {creating ? "Adding…" : "Add endpoint"}
        </Button>
      </form>

      {createdSecret && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Copy the signing secret now — it won&apos;t be shown again.</p>
          <code className="block mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/50 break-all">{createdSecret}</code>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setCreatedSecret(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border divide-y">
          {endpoints.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No webhooks yet. Add one above.</div>
          ) : (
            endpoints.map((ep) => (
              <div key={ep.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ep.url}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {ep.events.map((ev) => (
                      <Badge key={ev} variant="secondary" className="text-xs">
                        {ev}
                      </Badge>
                    ))}
                  </div>
                  {ep.lastError && (
                    <p className="text-xs text-destructive mt-1">Last error: {ep.lastError}</p>
                  )}
                  {ep.lastTriggeredAt && !ep.lastError && (
                    <p className="text-xs text-muted-foreground">Last sent: {new Date(ep.lastTriggeredAt).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ep.isActive ? (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(ep.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => deleteId && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This endpoint will stop receiving events. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteEndpoint(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
