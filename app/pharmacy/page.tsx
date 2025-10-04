"use client";
import { useState } from "react";

export default function PharmacyPortalPage() {
  const [email, setEmail] = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claim = async () => {
    setMessage(null); setError(null);
    try {
      const res = await fetch("/api/pharmacies/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pharmacyId })
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Claim started. Check your email to verify.");
    } catch (e: any) {
      setError(e.message || "Claim failed");
    }
  };

  return (
    <div>
      <h1>Pharmacy Portal</h1>
      <p>Verify and update availability as pharmacy staff.</p>
      <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <input placeholder="Work email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Pharmacy ID" value={pharmacyId} onChange={(e)=>setPharmacyId(e.target.value)} />
        <button onClick={claim} disabled={!email || !pharmacyId}>Start Claim</button>
        {message && <div style={{ color: 'green' }}>{message}</div>}
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
      </div>
    </div>
  );
}

