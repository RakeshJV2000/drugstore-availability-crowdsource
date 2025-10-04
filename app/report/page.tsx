"use client";
import { useState } from "react";

export default function ReportPage() {
  const [form, setForm] = useState({
    drug: "",
    status: "IN_STOCK",
    pharmacyName: "",
    address: "",
    lat: "",
    lng: "",
    note: ""
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drug: form.drug,
          status: form.status,
          pharmacy: { name: form.pharmacyName, address: form.address, lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
          note: form.note
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Report submitted. Thank you!");
      setForm({ drug: "", status: "IN_STOCK", pharmacyName: "", address: "", lat: "", lng: "", note: "" });
    } catch (e: any) {
      setError(e.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }));
      },
      (err) => setError(err.message || "Failed to get location"),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  };

  return (
    <div>
      <h1>Submit Availability Report</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
        <input placeholder="Drug name or NDC" value={form.drug} onChange={(e) => setForm({ ...form, drug: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW">Low</option>
          <option value="OUT">Out</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
        <input placeholder="Pharmacy name" value={form.pharmacyName} onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })} />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <input placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          <button type="button" onClick={useMyLocation}>Use my location</button>
        </div>
        <textarea placeholder="Optional note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button onClick={submit} disabled={loading || !form.drug || !form.pharmacyName || !form.address || !form.lat || !form.lng}>Submit</button>
        {message && <div style={{ color: 'green' }}>{message}</div>}
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
      </div>
    </div>
  );
}
