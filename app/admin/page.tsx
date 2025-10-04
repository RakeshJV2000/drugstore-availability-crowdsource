"use client";
import { useEffect, useState } from "react";

type Flag = { id: string; entityType: string; entityId: string; reason: string; state: string; createdAt: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [flags, setFlags] = useState<Flag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/flags", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFlags(data.flags);
    } catch (e: any) {
      setError(e.message || "Failed to load flags");
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateFlag = async (id: string, state: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/flags/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ state }) });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to update flag");
    }
  };

  return (
    <div>
      <h1>Admin Moderation</h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Admin token" value={token} onChange={(e)=>setToken(e.target.value)} />
        <button onClick={load} disabled={!token}>Refresh</button>
      </div>
      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        {flags.map((f) => (
          <div key={f.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <b>{f.entityType}</b> — {f.entityId}
                <div style={{ color: '#444' }}>{f.reason}</div>
                <div style={{ color: '#666', fontSize: 12 }}>Created: {new Date(f.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>Status: {f.state}</span>
                <button onClick={() => updateFlag(f.id, 'RESOLVED')}>Resolve</button>
                <button onClick={() => updateFlag(f.id, 'DISMISSED')}>Dismiss</button>
              </div>
            </div>
          </div>
        ))}
        {flags.length === 0 && <div>No flags.</div>}
      </div>
    </div>
  );
}

