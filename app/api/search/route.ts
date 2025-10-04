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
  const radiusKm = Number(searchParams.get("radiusKm") || 10);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return new NextResponse("Missing coords", { status: 400 });

  const bounds = approxLatLngBounds(lat, lng, radiusKm);

  if (mode === "store") {
    if (!storeQ) return new NextResponse("Missing store query", { status: 400 });

    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        lat: { gte: bounds.minLat, lte: bounds.maxLat },
        lng: { gte: bounds.minLng, lte: bounds.maxLng },
        name: { contains: storeQ, mode: "insensitive" },
      },
      include: {
        aggregates: { where: { status: ReportStatus.OUT }, include: { drug: true } },
      },
    });

    const results = pharmacies
      .map((p) => ({
        pharmacy: { id: p.id, name: p.name, address: p.address, lat: p.lat, lng: p.lng },
        outDrugs: p.aggregates.map((a) => ({ id: a.drugId, name: a.drug.name, lastVerifiedAt: a.lastVerifiedAt })),
        distanceKm: haversineKm(lat, lng, p.lat, p.lng),
      }))
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

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
      distanceKm: haversineKm(lat, lng, a.pharmacy.lat, a.pharmacy.lng)
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || new Date(b.lastVerifiedAt).getTime() - new Date(a.lastVerifiedAt).getTime());

  return NextResponse.json({ results: withDistance });
}
