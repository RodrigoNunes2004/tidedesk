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
import { Key, Plus, Trash2 } from "lucide-react";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysSection() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then((json: { data?: ApiKeyRow[]; error?: string }) => {
        if (json.error) return;
        setKeys(json.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName || "API key" }),
      });
      const data = (await res.json()) as { key?: string; error?: string };
      if (!res.ok) {
        alert(data.error ?? "Failed to create key");
        return;
      }
      if (data.key) {
        setCreatedKey(data.key);
        setNewName("");
        const listRes = await fetch("/api/api-keys");
        const list = (await listRes.json()) as { data?: ApiKeyRow[] };
        if (list.data) setKeys(list.data);
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setRevokeId(null);
      router.refresh();
    } else {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? "Failed to revoke");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium flex items-center gap-2">
          <Key className="size-4" />
          API Keys
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Use API keys to authenticate requests to the REST API. Base URL:{" "}
          <code className="rounded bg-muted px-1">{typeof window !== "undefined" ? window.location.origin : ""}/api/v1</code>
        </p>
      </div>

      <form onSubmit={createKey} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="key-name" className="sr-only">Key name</Label>
          <Input
            id="key-name"
            placeholder="e.g. Production, Mobile app"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating}
          />
        </div>
        <Button type="submit" disabled={creating}>
          <Plus className="size-4 mr-1" />
          {creating ? "Creating…" : "Create key"}
        </Button>
      </form>

      {createdKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Copy your key now — it won&apos;t be shown again.</p>
          <code className="block mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/50 break-all">{createdKey}</code>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(createdKey);
              setCreatedKey(null);
            }}
          >
            Copy and dismiss
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border divide-y">
          {keys.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No API keys yet. Create one above.</div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{k.keyPrefix}</p>
                  {k.lastUsedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">Last used: {new Date(k.lastUsedAt).toLocaleString()}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRevokeId(k.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      <AlertDialog open={!!revokeId} onOpenChange={() => revokeId && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Any applications using this key will stop working immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokeId && revokeKey(revokeId)}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
