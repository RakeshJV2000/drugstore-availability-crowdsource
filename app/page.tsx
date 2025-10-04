"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type SearchResult = {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  // Drug mode fields
  status?: string;
  confidence?: number;
  lastVerifiedAt?: string;
  // Store mode fields
  outDrugs?: { id: string; name: string }[];
  distanceKm: number;
};

export default function HomePage() {
  const [mode, setMode] = useState<"drug" | "store">("drug");
  const [drug, setDrug] = useState("");
  const [storeQ, setStoreQ] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("10");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gotGeo, setGotGeo] = useState(false);

  const Map = useMemo(() => dynamic(() => import("@/components/Map"), { ssr: false }), []);

  const search = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ lat, lng, radiusKm: radius, mode });
      if (mode === "drug") params.set("drug", drug);
      else params.set("q", storeQ);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data.results);
    } catch (e: any) {
      setError(e.message || "Search failed");
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
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
        setGotGeo(true);
      },
      (err) => setError(err.message || "Failed to get location"),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!gotGeo && !lat && !lng) {
      useMyLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">Find Drug Availability</h1>
        <p className="text-sm text-neutral-600">Search nearby by drug or by store name.</p>
      </div>

      <Map
        className="w-full h-[420px] rounded-md border"
        center={lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
        markers={(results || []).map(r => ({ lat: r.pharmacy.lat, lng: r.pharmacy.lng, label: r.pharmacy.name }))}
      />

      <div className="grid gap-3 max-w-xl">
        <div className="grid gap-1 max-w-xs">
          <Label>Search by</Label>
          <Select value={mode} onValueChange={(v: "drug"|"store") => setMode(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drug">Drug</SelectItem>
              <SelectItem value="store">Store</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === "drug" ? (
          <div className="grid gap-1">
            <Label htmlFor="drug">Drug</Label>
            <Input id="drug" placeholder="Drug name or NDC" value={drug} onChange={(e) => setDrug(e.target.value)} />
          </div>
        ) : (
          <div className="grid gap-1">
            <Label htmlFor="store">Store</Label>
            <Input id="store" placeholder="Store name (e.g., Walgreens)" value={storeQ} onChange={(e) => setStoreQ(e.target.value)} />
          </div>
        )}
        <div className="flex gap-2 items-center">
          <Input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
          <Input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
          <Input placeholder="Radius (km)" value={radius} onChange={(e) => setRadius(e.target.value)} className="w-32" />
          <Button type="button" variant="outline" onClick={useMyLocation}>Use my location</Button>
        </div>
        <Button onClick={search} disabled={loading || !lat || !lng || (mode === "drug" ? !drug : !storeQ)}>Search</Button>
      </div>

      {loading && <p>Searching…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {results && (
        <div className="mt-2">
          <h2 className="font-medium mb-2">Results</h2>
          {results.length === 0 && <p>No results yet. Try widening the radius.</p>}
          <ul className="grid gap-2 p-0 list-none">
            {results.map((r) => (
              <li key={r.pharmacy.id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <b>{r.pharmacy.name}</b>
                    <div className="text-neutral-600">{r.pharmacy.address}</div>
                  </div>
                  {mode === "drug" ? (
                    <div className="text-right text-sm">
                      <div>Status: {r.status}</div>
                      <div>Confidence: {(r.confidence || 0) * 100 % 1 === 0 ? (r.confidence || 0) * 100 : ((r.confidence || 0) * 100).toFixed(0)}%</div>
                      {r.lastVerifiedAt && <div>Updated: {new Date(r.lastVerifiedAt).toLocaleString()}</div>}
                      <div>Distance: {r.distanceKm.toFixed(1)} km</div>
                    </div>
                  ) : (
                    <div className="text-right text-sm">
                      <div>OUT: {(r.outDrugs || []).slice(0,3).map(d => d.name).join(', ') || '—'}</div>
                      {(r.outDrugs && r.outDrugs.length > 3) && <div>+{r.outDrugs.length - 3} more</div>}
                      <div>Distance: {r.distanceKm.toFixed(1)} km</div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
