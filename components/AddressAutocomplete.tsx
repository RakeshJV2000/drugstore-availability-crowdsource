"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: { label: string; lat: number; lng: number; title?: string }) => void;
  placeholder?: string;
  proximity?: { lat: number; lng: number } | null;
  className?: string;
  types?: string; // e.g., "address" or "poi,address"
};

type Suggestion = { label: string; lat: number; lng: number; title?: string };

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, proximity, className, types = "address" }: Props) {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canQuery = key && value.trim().length >= 3;

  useEffect(() => {
    if (!canQuery) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const q = encodeURIComponent(value.trim());
        const prox = proximity && Number.isFinite(proximity.lat) && Number.isFinite(proximity.lng)
          ? `&proximity=${proximity.lng},${proximity.lat}`
          : "";
        const url = `https://api.maptiler.com/geocoding/${q}.json?key=${key}&autocomplete=true&types=${encodeURIComponent(types)}&limit=5${prox}`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error("geocoding failed");
        const data = await res.json();
        const feats = Array.isArray(data?.features) ? data.features : [];
        const mapped: Suggestion[] = feats.map((f: any) => ({
          label: f?.place_name || f?.place_name_en || f?.text || "Unknown",
          title: f?.text || f?.properties?.name,
          lat: Array.isArray(f?.center) ? Number(f.center[1]) : Number(f?.geometry?.coordinates?.[1]),
          lng: Array.isArray(f?.center) ? Number(f.center[0]) : Number(f?.geometry?.coordinates?.[0]),
        })).filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
        setSuggestions(mapped);
        setOpen(mapped.length > 0);
      } catch (_) {
        // swallow
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [value, proximity?.lat, proximity?.lng, canQuery, key]);

  const pick = (s: Suggestion) => {
    // Let parent update the controlled value and any side effects (like lat/lng)
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        placeholder={placeholder || "Search address"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white text-neutral-900 shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
          {loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-neutral-500">Searching…</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {s.label}
            </button>
          ))}
          {(!loading && suggestions.length === 0) && (
            <div className="px-3 py-2 text-sm text-neutral-500">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
