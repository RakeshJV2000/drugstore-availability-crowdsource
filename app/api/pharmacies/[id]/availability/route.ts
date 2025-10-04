import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportSource, ReportStatus } from "@prisma/client";
import { recomputeAggregate } from "@/lib/aggregate";
import { assertStaff, getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rateLimit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Simple protection: require staff token and rate limit
    assertStaff(req);
    const ip = getClientIp(req);
    if (!rateLimit("pharmacy:availability", ip, 60, 60_000)) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }
    const pharmacyId = params.id;
    const { drug, status } = await req.json();
    if (!drug || !status) return new NextResponse("Missing drug or status", { status: 400 });
    if (!Object.values(ReportStatus).includes(status)) return new NextResponse("Invalid status", { status: 400 });

    const d = await prisma.drug.findFirst({ where: { OR: [{ name: { equals: drug, mode: "insensitive" } }, { ndc: drug }] } });
    if (!d) return new NextResponse("Drug not found", { status: 404 });

    // Staff update creates a staff-sourced report and updates aggregate
    await prisma.availabilityReport.create({ data: { drugId: d.id, pharmacyId, status, source: ReportSource.STAFF } });
    const aggregate = await recomputeAggregate(prisma, d.id, pharmacyId);

    return NextResponse.json({ ok: true, aggregate });
  } catch (e: any) {
    return new NextResponse(e.message || "Failed to update availability", { status: 400 });
  }
}
