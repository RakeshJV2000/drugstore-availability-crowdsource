"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";

export default function ReportPage() {
  const Map = useMemo(() => dynamic(() => import("@/components/Map"), { ssr: false }), []);
  const { user, isLoading } = useUser();
  const [form, setForm] = useState({
    drug: "",
    status: "IN_STOCK",
    pharmacyName: "",
    address: "",
    lat: "",
    lng: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drug: form.drug,
          status: form.status,
          pharmacy: {
            name: form.pharmacyName,
            address: form.address,
            lat: parseFloat(form.lat),
            lng: parseFloat(form.lng),
          },
          note: form.note,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Report submitted", description: "Thanks for contributing!" });
      setForm({
        drug: "",
        status: "IN_STOCK",
        pharmacyName: "",
        address: "",
        lat: "",
        lng: "",
        note: "",
      });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        }));
      },
      (err) => toast({ title: "Location error", description: err.message || "Failed to get location", variant: "destructive" }),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  };

  const disabled =
    loading || !form.drug || !form.pharmacyName || !form.address || !form.lat || !form.lng;

  if (!user && !isLoading) {
    return (
      <div className="grid gap-4 max-w-2xl">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold">Sign in to submit a report</h1>
          <p className="text-sm text-neutral-600">Reporting is gated to signed-in users to reduce spam and enable moderation.</p>
        </div>
        <div>
          <Button asChild>
            <Link href="/api/auth/login">Sign in with Auth0</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Submit Availability Report</h1>
        <p className="text-sm text-neutral-600">
          Share what you see at your local pharmacy.
        </p>
      </div>

      <div className="grid gap-3 max-w-2xl">
        <div className="grid gap-1">
          <Label htmlFor="drug">Drug</Label>
          <Input
            id="drug"
            placeholder="Drug name or NDC"
            value={form.drug}
            onChange={(e) => setForm({ ...form, drug: e.target.value })}
          />
        </div>

        <div className="grid gap-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_STOCK">In stock</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="OUT">Out</SelectItem>
              <SelectItem value="UNKNOWN">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="pharmacyName">Pharmacy name</Label>
          <Input
            id="pharmacyName"
            placeholder="e.g., Walgreens on 3rd"
            value={form.pharmacyName}
            onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })}
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="address">Address</Label>
          <AddressAutocomplete
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            onSelect={(s) => setForm({ ...form, address: s.label, lat: s.lat.toString(), lng: s.lng.toString() })}
            placeholder="Store name or address (e.g., Walgreens, 123 Main St)"
            proximity={form.lat && form.lng ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) } : null}
            types="poi,address"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Input
            placeholder="Latitude"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
          />
          <Input
            placeholder="Longitude"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
          />
          <Button type="button" variant="outline" onClick={useMyLocation}>
            Use my location
          </Button>
        </div>

        <div className="mt-2">
          {/* lightweight dynamic import usage */}
          {/* @ts-ignore */}
          <Map
            className="w-full h-64 rounded-md border"
            center={form.lat && form.lng ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) } : null}
            markers={form.lat && form.lng ? [{ lat: parseFloat(form.lat), lng: parseFloat(form.lng), label: "Selected" }] : []}
            enablePick
            onPick={({ lat, lng }) => setForm(f => ({ ...f, lat: lat.toString(), lng: lng.toString() }))}
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Add context (e.g., forms, quantity limits, staff notes)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div>
          <Button onClick={submit} disabled={disabled}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
