import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    assertAdmin(req);
    const id = params.id;
    if (!id) return new NextResponse("Missing user id", { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.availabilityReport.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.auditLog.updateMany({ where: { actorId: id }, data: { actorId: null } });
      await tx.flag.deleteMany({ where: { createdById: id } });
      await tx.watchlist.deleteMany({ where: { userId: id } });
      await tx.pharmacy.updateMany({ where: { claimedByUserId: id }, data: { claimedByUserId: null } });
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status || 500;
    return new NextResponse(e?.message || "Failed to delete user", { status });
  }
}

