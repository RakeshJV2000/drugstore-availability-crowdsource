import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    assertAdmin(req);
    const id = params.id;
    if (!id) return new NextResponse("Missing drug id", { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.drugSynonym.deleteMany({ where: { drugId: id } });
      await tx.watchlist.deleteMany({ where: { drugId: id } });
      await tx.statusAggregate.deleteMany({ where: { drugId: id } });
      await tx.availabilityReport.deleteMany({ where: { drugId: id } });
      await tx.drug.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status || 500;
    return new NextResponse(e?.message || "Failed to delete drug", { status });
  }
}

