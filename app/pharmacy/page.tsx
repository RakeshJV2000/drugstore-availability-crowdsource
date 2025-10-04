"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function PharmacyPortalPage() {
  const [email, setEmail] = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [loading, setLoading] = useState(false);

  const claim = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacies/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pharmacyId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Claim started", description: "Check your email to verify." });
      setEmail("");
      setPharmacyId("");
    } catch (e: any) {
      toast({ title: "Claim failed", description: e.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Pharmacy Portal</h1>
        <p className="text-sm text-neutral-600">Verify and update availability as pharmacy staff.</p>
      </div>
      <div className="grid gap-3 max-w-md">
        <div className="grid gap-1">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" placeholder="you@pharmacy.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="pharmacy">Pharmacy ID</Label>
          <Input id="pharmacy" placeholder="Pharmacy ID" value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)} />
        </div>
        <div>
          <Button onClick={claim} disabled={!email || !pharmacyId || loading}>
            {loading ? "Starting..." : "Start Claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
