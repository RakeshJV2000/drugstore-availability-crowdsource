import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";
import { ReportStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    assertAdmin(req);

    const drugs = await prisma.drug.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, ndc: true, _count: { select: { reports: true } } },
      take: 200,
    });

    const agg = await prisma.statusAggregate.groupBy({
      by: ["drugId", "status"],
      _count: { _all: true },
      where: { drugId: { in: drugs.map((d) => d.id) } },
    });

    const countsByDrug: Record<string, Partial<Record<ReportStatus, number>>> = {};
    for (const a of agg) {
      if (!countsByDrug[a.drugId]) countsByDrug[a.drugId] = {};
      countsByDrug[a.drugId][a.status as ReportStatus] = a._count._all;
    }

    const recentReports = await prisma.availabilityReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        createdAt: true,
        note: true,
        drug: { select: { id: true, name: true } },
        pharmacy: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, handle: true, email: true } },
      },
    });

    const result = drugs.map((d) => ({
      id: d.id,
      name: d.name,
      ndc: d.ndc,
      reports: d._count.reports,
      inStock: countsByDrug[d.id]?.IN_STOCK || 0,
      low: countsByDrug[d.id]?.LOW || 0,
      out: countsByDrug[d.id]?.OUT || 0,
      unknown: countsByDrug[d.id]?.UNKNOWN || 0,
    }));

    return NextResponse.json({ drugs: result, recentReports });
  } catch (e: any) {
    const status = e?.status || 500;
    return new NextResponse(e?.message || "Failed", { status });
  }
}

