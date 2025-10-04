import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportSource, ReportStatus } from "@prisma/client";
import { recomputeAggregate } from "@/lib/aggregate";
import { requireSessionUser } from "@/lib/auth";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rateLimit";

type Body = {
  drug: string; // name or NDC
  status: ReportStatus | string;
  pharmacy?: { id?: string; name?: string; address?: string; lat?: number; lng?: number };
  note?: string;
};

async function findOrCreateDrug(identifier: string) {
  const ndcLike = /\d/.test(identifier);
  let drug = await prisma.drug.findFirst({
    where: ndcLike
      ? { OR: [{ ndc: identifier }, { name: { equals: identifier, mode: "insensitive" } }, { synonyms: { some: { name: { equals: identifier, mode: "insensitive" } } } }] }
      : { OR: [{ name: { equals: identifier, mode: "insensitive" } }, { synonyms: { some: { name: { equals: identifier, mode: "insensitive" } } } }] }
  });
  if (!drug) {
    drug = await prisma.drug.create({ data: { name: identifier } });
  }
  return drug;
}

async function findOrCreatePharmacy(input?: Body["pharmacy"]) {
  if (!input) throw new Error("Pharmacy info required");
  if (input.id) {
    const ph = await prisma.pharmacy.findUnique({ where: { id: input.id } });
    if (!ph) throw new Error("Pharmacy not found");
    return ph;
  }
  if (!input.name || !input.address || typeof input.lat !== "number" || typeof input.lng !== "number") {
    throw new Error("Pharmacy name, address, lat, lng required");
  }
  return prisma.pharmacy.create({ data: { name: input.name, address: input.address, lat: input.lat, lng: input.lng } });
}

export async function POST(req: Request) {
  try {
    const sessionUser = await requireSessionUser();
    const ip = getClientIp(req);
    if (!rateLimit("reports:post", ip, 20, 60_000)) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }
    const body = (await req.json()) as Body;
    if (!body.drug) return new NextResponse("Missing drug", { status: 400 });
    if (!body.status) return new NextResponse("Missing status", { status: 400 });

    const status = (body.status as ReportStatus) ?? "UNKNOWN";
    if (!Object.values(ReportStatus).includes(status)) return new NextResponse("Invalid status", { status: 400 });

    const [drug, pharmacy] = await Promise.all([
      findOrCreateDrug(body.drug.trim()),
      findOrCreatePharmacy(body.pharmacy)
    ]);

    const report = await prisma.availabilityReport.create({
      data: {
        drugId: drug.id,
        pharmacyId: pharmacy.id,
        status,
        source: ReportSource.PUBLIC,
        userId: sessionUser.id,
        note: body.note?.slice(0, 500)
      }
    });

    const aggregate = await recomputeAggregate(prisma, drug.id, pharmacy.id);

    return NextResponse.json({ ok: true, report, aggregate });
  } catch (e: any) {
    return new NextResponse(e.message || "Failed to create report", { status: 400 });
  }
}
