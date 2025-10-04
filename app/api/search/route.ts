import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm, approxLatLngBounds } from "@/lib/geo";
import { ReportStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "drug").toLowerCase();
  const drugQ = (searchParams.get("drug") || "").trim();
  const storeQ = (searchParams.get("q") || "").trim();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusMiParam = Number(searchParams.get("radiusMi"));
  const hasRadiusMi = Number.isFinite(radiusMiParam);
  let radiusKm = Number(searchParams.get("radiusKm") || 10);
  let radiusMi = hasRadiusMi ? radiusMiParam : radiusKm * 0.621371;
  if (hasRadiusMi) radiusKm = radiusMiParam / 0.621371;
  const limitRaw = Number(searchParams.get("limit") || 15);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 50) : 15;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return new NextResponse("Missing coords", { status: 400 });

  const bounds = approxLatLngBounds(lat, lng, radiusKm);

  if (mode === "store") {

    const terms = storeQ.split(',').map(s => s.trim()).filter(Boolean);
    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        lat: { gte: bounds.minLat, lte: bounds.maxLat },
        lng: { gte: bounds.minLng, lte: bounds.maxLng },
        ...(terms.length > 0
          ? { OR: terms.map(t => ({ name: { contains: t, mode: "insensitive" } })) }
          : {}),
      },
      include: {
        aggregates: { include: { drug: true } },
      },
    });

    const results = pharmacies
      .map((p) => ({
        pharmacy: { id: p.id, name: p.name, address: p.address, lat: p.lat, lng: p.lng },
        inStock: p.aggregates.filter(a => a.status === ReportStatus.IN_STOCK).map((a) => ({ id: a.drugId, name: a.drug.name, lastVerifiedAt: a.lastVerifiedAt })),
        low: p.aggregates.filter(a => a.status === ReportStatus.LOW).map((a) => ({ id: a.drugId, name: a.drug.name, lastVerifiedAt: a.lastVerifiedAt })),
        out: p.aggregates.filter(a => a.status === ReportStatus.OUT).map((a) => ({ id: a.drugId, name: a.drug.name, lastVerifiedAt: a.lastVerifiedAt })),
        unknown: p.aggregates.filter(a => a.status === ReportStatus.UNKNOWN).map((a) => ({ id: a.drugId, name: a.drug.name, lastVerifiedAt: a.lastVerifiedAt })),
        distanceMi: haversineKm(lat, lng, p.lat, p.lng) * 0.621371,
      }))
      .filter((r) => r.distanceMi <= radiusMi)
      .sort((a, b) => a.distanceMi - b.distanceMi)
      .slice(0, limit);

    return NextResponse.json({ results });
  }

  // Default: drug mode
  if (!drugQ) return new NextResponse("Missing drug", { status: 400 });

  const ndcLike = /\d/.test(drugQ);
  const drug = await prisma.drug.findFirst({
    where: ndcLike
      ? { OR: [{ ndc: drugQ }, { name: { equals: drugQ, mode: "insensitive" } }, { synonyms: { some: { name: { equals: drugQ, mode: "insensitive" } } } }] }
      : { OR: [{ name: { equals: drugQ, mode: "insensitive" } }, { synonyms: { some: { name: { equals: drugQ, mode: "insensitive" } } } }] }
  });

  if (!drug) return NextResponse.json({ results: [] });

  const aggregates = await prisma.statusAggregate.findMany({
    where: {
      drugId: drug.id,
      // Only show locations that are not OUT of stock
      status: { not: ReportStatus.OUT },
      pharmacy: {
        lat: { gte: bounds.minLat, lte: bounds.maxLat },
        lng: { gte: bounds.minLng, lte: bounds.maxLng }
      }
    },
    include: { pharmacy: true }
  });

  const withDistance = aggregates
    .map((a) => ({
      pharmacy: { id: a.pharmacy.id, name: a.pharmacy.name, address: a.pharmacy.address, lat: a.pharmacy.lat, lng: a.pharmacy.lng },
      status: a.status,
      confidence: a.confidence,
      lastVerifiedAt: a.lastVerifiedAt,
      distanceMi: haversineKm(lat, lng, a.pharmacy.lat, a.pharmacy.lng) * 0.621371
    }))
    .filter((r) => r.distanceMi <= radiusMi)
    .sort((a, b) => a.distanceMi - b.distanceMi || new Date(b.lastVerifiedAt).getTime() - new Date(a.lastVerifiedAt).getTime())
    .slice(0, limit);

  return NextResponse.json({ results: withDistance });
}
