import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    assertAdmin(req);
    const { state } = await req.json();
    if (!state) return new NextResponse("Missing state", { status: 400 });
    const flag = await prisma.flag.update({ where: { id: params.id }, data: { state } });
    return NextResponse.json({ ok: true, flag });
  } catch (e: any) {
    const status = e.status || 400;
    return new NextResponse(e.message || "Failed to update flag", { status });
  }
}

