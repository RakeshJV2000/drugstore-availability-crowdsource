"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Flag = { id: string; entityType: string; entityId: string; reason: string; state: string; createdAt: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [flags, setFlags] = useState<Flag[]>([]);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/flags", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFlags(data.flags);
    } catch (e: any) {
      toast({ title: "Failed to load flags", description: e.message || "", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateFlag = async (id: string, state: string) => {
    try {
      const res = await fetch(`/api/admin/flags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: `Flag ${state.toLowerCase()}` });
      await load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Admin Moderation</h1>
        <p className="text-sm text-neutral-600">Enter your admin token to manage flags.</p>
      </div>
      <div className="flex items-center gap-2">
        <Input placeholder="Admin token" value={token} onChange={(e) => setToken(e.target.value)} />
        <Button onClick={load} disabled={!token}>Refresh</Button>
      </div>
      <div className="grid gap-2">
        {flags.map((f) => (
          <div key={f.id} className="border rounded-md p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{f.entityType} — {f.entityId}</div>
                <div className="text-neutral-700">{f.reason}</div>
                <div className="text-neutral-500 text-xs">Created: {new Date(f.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-600">Status: {f.state}</span>
                <Button variant="outline" onClick={() => updateFlag(f.id, 'RESOLVED')}>Resolve</Button>
                <Button variant="outline" onClick={() => updateFlag(f.id, 'DISMISSED')}>Dismiss</Button>
              </div>
            </div>
          </div>
        ))}
        {flags.length === 0 && <div className="text-neutral-600">No flags.</div>}
      </div>
    </div>
  );
}
