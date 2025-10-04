"use client";
/* App main page */

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import AddressAutocomplete from "@/components/AddressAutocomplete";

type SearchResult = {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    kind:string;
  };
  // Drug mode fields
  status?: string;
  confidence?: number;
  lastVerifiedAt?: string;
  // Store mode fields
  inStock?: { id: string; name: string; lastVerifiedAt?: string }[];
  low?: { id: string; name: string; lastVerifiedAt?: string }[];
  out?: { id: string; name: string; lastVerifiedAt?: string }[];
  unknown?: { id: string; name: string; lastVerifiedAt?: string }[];
  distanceMi: number;
};

export default function HomePage() {
  const [mode, setMode] = useState<"drug" | "store">("drug");
  const [drug, setDrug] = useState("");
  const [storeQ, setStoreQ] = useState("");
  const [storeInput, setStoreInput] = useState("");
  const [storeQueryMode, setStoreQueryMode] = useState<"brand" | "address" | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [hideNoData, setHideNoData] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("10");
  const [centerAddr, setCenterAddr] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gotGeo, setGotGeo] = useState(false);
  const [centerSource, setCenterSource] = useState<"geo" | "search" | "pick" | null>(null);

  const Map = useMemo(() => dynamic(() => import("@/components/Map"), { ssr: false }), []);
  const [pickOnMap, setPickOnMap] = useState(false);

  function timeAgo(iso: string) {
    const d = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - d);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins===1?"":"s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs===1?"":"s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days===1?"":"s"} ago`;
  }

  const displayedResults = useMemo(() => {
    if (!results) return null;
    if (!hideNoData) return results;
    return results.filter(r => {
      const total = (r.inStock?.length || 0) + (r.low?.length || 0) + (r.out?.length || 0) + (r.unknown?.length || 0);
      return total > 0;
    });
  }, [results, hideNoData]);

  const search = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ lat, lng, radiusMi: radius, mode });
      if (mode === "drug") {
        params.set("drug", drug);
      } else {
        let q = "";
        if (selectedBrands.length > 0) q = selectedBrands.join(",");
        else if (storeQueryMode === "brand") q = storeQ || storeInput;
        if (q) params.set("q", q);
      }
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let base: SearchResult[] = data.results || [];

      // Fallback: if store mode returns few/zero DB stores, augment with nearby POI pharmacies from MapTiler
      if (mode === "store" && base.length < 12 && lat && lng && process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
        try {
          const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY as string;
          const prox = `${parseFloat(lng).toFixed(6)},${parseFloat(lat).toFixed(6)}`;
          const url = `https://api.maptiler.com/geocoding/${encodeURIComponent('pharmacy')}.json?key=${key}&types=poi&proximity=${prox}&limit=15`;
          const r = await fetch(url);
          if (r.ok) {
            const j = await r.json();
            const feats: any[] = Array.isArray(j?.features) ? j.features : [];
            const seen = new Set(base.map(b => b.pharmacy.id));
            const mkId = (lng: number, lat: number, name: string) => `ext:${name}:${lat.toFixed(5)},${lng.toFixed(5)}`;
            const dist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
              const toRad = (v: number) => (v * Math.PI) / 180;
              const R = 3958.8; // miles
              const dLat = toRad(lat2 - lat1);
              const dLon = toRad(lon2 - lon1);
              const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            };
            const augmented: SearchResult[] = [];
            const lat0 = parseFloat(lat);
            const lng0 = parseFloat(lng);
            for (const f of feats) {
              const c = Array.isArray(f?.center) ? f.center : f?.geometry?.coordinates;
              if (!c || c.length < 2) continue;
              const flng = Number(c[0]);
              const flat = Number(c[1]);
              if (!Number.isFinite(flng) || !Number.isFinite(flat)) continue;
              const name = f?.text || f?.properties?.name || f?.place_name || 'Pharmacy';
              const id = mkId(flng, flat, name);
              if (seen.has(id)) continue;
              // skip if very close to an existing DB store marker (<0.05 mi ≈ 80m)
              const tooClose = base.some(b => dist(flat, flng, b.pharmacy.lat, b.pharmacy.lng) < 0.05);
              if (tooClose) continue;
              augmented.push({
                pharmacy: { id, name, address: f?.place_name || '', lat: flat, lng: flng },
                inStock: [], low: [], out: [], unknown: [],
                distanceMi: dist(lat0, lng0, flat, flng)
              });
              seen.add(id);
              if (base.length + augmented.length >= 15) break;
            }
            base = [...base, ...augmented].sort((a,b) => a.distanceMi - b.distanceMi).slice(0, 15);
          }
        } catch {
          // ignore fallback errors
        }
      }

      setResults(base);
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
        setCenterSource("geo");
      },
      (err) => setError(err.message || "Failed to get location"),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  };

  // Only use location when user explicitly clicks the button.

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">Find Drug Availability</h1>
        <p className="text-sm text-neutral-600">Search nearby by drug or by store name.</p>
      </div>

      <Map
        className="w-full h-[420px] rounded-md border"
        center={lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
        markers={[
          ...(lat && lng ? [{ lat: parseFloat(lat), lng: parseFloat(lng), label: centerSource === 'geo' ? 'You' : 'Center', color: centerSource === 'geo' ? '#22c55e' : undefined, popup: centerSource === 'geo' ? 'Your location' : 'Search center' }] : []),
          ...((displayedResults || []) as SearchResult[]).map(r => ({
            lat: r.pharmacy.lat,
            lng: r.pharmacy.lng,
            label: r.pharmacy.name,
            popup: `${r.pharmacy.name}\n${r.pharmacy.address}`,
          }))
        ]}
        enablePick={pickOnMap}
        onPick={({ lat: plat, lng: plng }) => { setLat(plat.toString()); setLng(plng.toString()); setGotGeo(true); setCenterSource('pick'); }}
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
            <Label htmlFor="store">Store or address</Label>
            <AddressAutocomplete
              value={storeInput}
              onChange={(v) => { setStoreInput(v); setStoreQueryMode(null); }}
              onSelect={(s) => {
                setStoreInput(s.label);
                // Use the feature title (brand/name) for store query when available
                if (s.kind === 'poi') { setStoreQ(s.title || s.label); setStoreQueryMode('brand'); }
                else { setStoreQ(""); setStoreQueryMode('address'); }
                setLat(s.lat.toString());
                setLng(s.lng.toString());
                setCenterSource("search");
              }}
              placeholder="Type store name (e.g., Walgreens) or address"
              proximity={lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
              types="poi,address"
            />
            <div className="flex flex-wrap gap-3 mt-1 text-sm">
              {["Walgreens","CVS","Rite Aid","Walmart"].map(b => (
                <label key={b} className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={(e) => setSelectedBrands(prev => e.target.checked ? [...prev, b] : prev.filter(x => x !== b))}
                  />
                  <span>{b}</span>
                </label>
              ))}
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={hideNoData}
                  onChange={(e) => setHideNoData(e.target.checked)}
                />
                <span>Hide stores with no data</span>
              </label>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <Label>Location</Label>
          <div className="flex gap-2 items-center">
            <AddressAutocomplete
              value={centerAddr}
              onChange={setCenterAddr}
              onSelect={(s) => { setCenterAddr(s.label); setLat(s.lat.toString()); setLng(s.lng.toString()); setGotGeo(true); setCenterSource("search"); }}
              
              placeholder="Search a place or address to set center"
              proximity={lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
              types="poi,address"
            />
            <Button type="button" variant="outline" onClick={useMyLocation}>Use my location</Button>
            <Button type="button" variant={pickOnMap ? "default" : "outline"} onClick={() => setPickOnMap(v => !v)}>{pickOnMap ? "Picking: click map" : "Pick on map"}</Button>
          </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="text-neutral-700 dark:text-neutral-300">
              Center: {centerAddr || (lat && lng ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` : "not set")}
              {" • "}Radius:
              </div>
            <Input placeholder="Radius (mi)" value={radius} onChange={(e) => setRadius(e.target.value)} className="w-28" />
              {(lat && lng) && (
                <Button type="button" variant="outline" onClick={() => { setLat(""); setLng(""); setCenterAddr(""); }}>Clear</Button>
              )}
            </div>
        </div>
        <Button onClick={search} disabled={loading || !lat || !lng || (mode === "drug" ? !drug : false)}>Search</Button>
      </div>

      {loading && <p>Searching…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {displayedResults && (
        <div className="mt-2">
          <h2 className="font-medium mb-2">Results</h2>
          {displayedResults.length === 0 && <p>No data found.</p>}
          <ul className="grid gap-2 p-0 list-none">
            {displayedResults.map((r) => (
              <li key={r.pharmacy.id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <b>{r.pharmacy.name}</b>
                    <div className="text-neutral-600">{r.pharmacy.address}</div>
                  </div>
                  {mode === "drug" ? (
                    <div className="text-right text-sm">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'IN_STOCK' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : r.status === 'LOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : r.status === 'OUT' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'}`}>{r.status}</span>
                      </div>
                      <div>Confidence: {Math.round((r.confidence || 0) * 100)}%</div>
                      {r.lastVerifiedAt && <div>Updated: {timeAgo(r.lastVerifiedAt)}</div>}
                      <div>Distance: {r.distanceMi.toFixed(1)} mi</div>
                    </div>
                  ) : (
                    <div className="text-right text-sm w-full">
                      {(((r.inStock?.length || 0) + (r.low?.length || 0) + (r.out?.length || 0) + (r.unknown?.length || 0)) === 0) ? (
                        <div className="text-left text-neutral-600">No data available</div>
                      ) : (
                        <div className="text-left grid gap-2">
                          {([['IN_STOCK', r.inStock], ['LOW', r.low], ['OUT', r.out], ['UNKNOWN', r.unknown]] as const).map(([label, list]) => (
                            <details key={label} className="border rounded-md">
                              <summary className="flex items-center justify-between px-2 py-1 cursor-pointer">
                                <span>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${label === 'IN_STOCK' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : label === 'LOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : label === 'OUT' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'}`}>{label}</span>
                                  <span className="text-neutral-700 dark:text-neutral-300">{(list || []).length} drugs</span>
                                </span>
                                <span className="text-neutral-500">▼</span>
                              </summary>
                              <div className="px-3 py-2">
                                {(list || []).length === 0 && <div className="text-neutral-500">None</div>}
                                {(list || []).length > 0 && (
                                  <ul className="m-0 p-0 list-disc list-inside space-y-1">
                                    {(list || []).map(d => (
                                      <li key={d.id}>
                                        <span className="font-medium">{d.name}</span>
                                        {d.lastVerifiedAt && <span className="text-neutral-500"> — updated {timeAgo(d.lastVerifiedAt)}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      )}
                      <div>Distance: {r.distanceMi.toFixed(1)} mi</div>
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
