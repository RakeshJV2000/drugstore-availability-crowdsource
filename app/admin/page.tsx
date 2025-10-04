"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Flag = { id: string; entityType: string; entityId: string; reason: string; state: string; createdAt: string };
type UserRow = { id: string; email: string | null; handle: string | null; role: string; createdAt: string; _count: { reports: number } };
type DrugRow = { id: string; name: string; ndc: string | null; reports: number; inStock: number; low: number; out: number; unknown: number };
type RecentReport = { id: string; status: string; createdAt: string; note?: string | null; drug: { id: string; name: string }; pharmacy: { id: string; name: string; address: string }; user: { id: string; handle: string | null; email: string | null } | null };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"users" | "drugs" | "flags">("users");
  const [flags, setFlags] = useState<Flag[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [drugs, setDrugs] = useState<DrugRow[]>([]);
  const [recent, setRecent] = useState<RecentReport[]>([]);
  const [stats, setStats] = useState<{ users: number; drugs: number } | null>(null);

  const loadFlags = async () => {
    try {
      const res = await fetch("/api/admin/flags", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFlags(data.flags);
    } catch (e: any) {
      toast({ title: "Failed to load flags", description: e.message || "", variant: "destructive" });
    }
  };
  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e: any) {
      toast({ title: "Failed to load users", description: e.message || "", variant: "destructive" });
    }
  };
  const loadDrugs = async () => {
    try {
      const res = await fetch("/api/admin/drugs", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDrugs(data.drugs || []);
      setRecent(data.recentReports || []);
    } catch (e: any) {
      toast({ title: "Failed to load drugs", description: e.message || "", variant: "destructive" });
    }
  };
  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStats({ users: data.users || 0, drugs: data.drugs || 0 });
    } catch (e: any) {
      // Non-fatal
    }
  };

  useEffect(() => {
    if (!authed) return;
    if (tab === "users") loadUsers();
    if (tab === "drugs") loadDrugs();
    if (tab === "flags") loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, authed]);

  const updateFlag = async (id: string, state: string) => {
    try {
      const res = await fetch(`/api/admin/flags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: `Flag ${state.toLowerCase()}` });
      await loadFlags();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-neutral-600">Enter your admin token to view data.</p>
      </div>
      <div className="flex items-center gap-2">
        <Input placeholder="Admin token" value={token} onChange={(e) => { setToken(e.target.value); setAuthed(false); }} />
        <Button
          onClick={async () => {
            try {
              if (!token) { toast({ title: "Token required", variant: "destructive" }); return; }
              // Verify token by hitting a protected endpoint
              const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
              if (!res.ok) throw new Error(await res.text());
              setAuthed(true);
              toast({ title: "Admin verified" });
              // Load current tab after auth
              loadStats();
              if (tab === "users") loadUsers();
              if (tab === "drugs") loadDrugs();
              if (tab === "flags") loadFlags();
            } catch (e: any) {
              setAuthed(false);
              toast({ title: "Invalid admin token", description: e?.message || "", variant: "destructive" });
            }
          }}
        >
          Submit token
        </Button>
      </div>

      {authed && stats && (
        <div className="flex items-center gap-4 text-sm text-neutral-700 dark:text-neutral-300">
          <div><span className="font-medium">Users:</span> {stats.users}</div>
          <div><span className="font-medium">Drugs:</span> {stats.drugs}</div>
        </div>
      )}

      {authed && (
        <div className="flex gap-2 border-b dark:border-neutral-800">
          <button className={`px-3 py-2 text-sm ${tab==='users' ? 'border-b-2 border-neutral-900 dark:border-neutral-100 font-medium' : 'text-neutral-600'}`} onClick={() => setTab('users')}>Users</button>
          <button className={`px-3 py-2 text-sm ${tab==='drugs' ? 'border-b-2 border-neutral-900 dark:border-neutral-100 font-medium' : 'text-neutral-600'}`} onClick={() => setTab('drugs')}>Drugs</button>
          <button className={`px-3 py-2 text-sm ${tab==='flags' ? 'border-b-2 border-neutral-900 dark:border-neutral-100 font-medium' : 'text-neutral-600'}`} onClick={() => setTab('flags')}>Flags</button>
        </div>
      )}

      {!authed && (
        <div className="text-neutral-600">Submit a valid admin token to continue.</div>
      )}

      {authed && tab === "users" && (
        <div className="grid gap-2">
          {users.map((u) => (
            <div key={u.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.handle || "(no handle)"}</div>
                  <div className="text-sm text-neutral-600">{u.email || "(no email)"}</div>
                </div>
                <div className="text-right text-sm">
                  <div>Role: {u.role}</div>
                  <div>Reports: {u._count.reports}</div>
                  <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                  <div className="mt-2 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!confirm(`Delete user ${u.handle || u.email || u.id}? This cannot be undone.`)) return;
                        try {
                          const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          if (!res.ok) throw new Error(await res.text());
                          toast({ title: 'User deleted' });
                          loadUsers();
                          loadStats();
                        } catch (e: any) {
                          toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="text-neutral-600">No users loaded.</div>}
        </div>
      )}

      {authed && tab === "drugs" && (
        <div className="grid gap-4">
          <div className="grid gap-2">
            {drugs.map((d) => (
              <div key={d.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    {d.ndc && <div className="text-sm text-neutral-600">NDC: {d.ndc}</div>}
                  </div>
                  <div className="text-right text-sm">
                    <div>Reports: {d.reports}</div>
                    <div>In stock: {d.inStock} • Low: {d.low} • Out: {d.out} • Unknown: {d.unknown}</div>
                    <div className="mt-2 flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!confirm(`Delete drug ${d.name}? This will remove its reports and aggregates.`)) return;
                          try {
                            const res = await fetch(`/api/admin/drugs/${d.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                            if (!res.ok) throw new Error(await res.text());
                            toast({ title: 'Drug deleted' });
                            loadDrugs();
                            loadStats();
                          } catch (e: any) {
                            toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {drugs.length === 0 && <div className="text-neutral-600">No drugs loaded.</div>}
          </div>
          <div className="grid gap-2">
            <h2 className="font-medium">Recent Reports</h2>
            {recent.map((r) => (
              <div key={r.id} className="border rounded-md p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div><b>{r.drug.name}</b> @ {r.pharmacy.name}</div>
                    <div className="text-neutral-600">{r.pharmacy.address}</div>
                    {r.note && <div className="text-neutral-700 mt-1">“{r.note}”</div>}
                  </div>
                  <div className="text-right">
                    <div>Status: {r.status}</div>
                    <div>User: {r.user?.handle || r.user?.email || "(unknown)"}</div>
                    <div className="text-neutral-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
            {recent.length === 0 && <div className="text-neutral-600">No recent reports.</div>}
          </div>
        </div>
      )}

      {authed && tab === "flags" && (
        <div className="grid gap-2">
          {flags.map((f) => (
            <div key={f.id} className="border rounded-md p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{f.entityType} • {f.entityId}</div>
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
      )}
    </div>
  );
}
