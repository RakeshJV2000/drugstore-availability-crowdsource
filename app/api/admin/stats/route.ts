import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";

export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const [users, drugs] = await Promise.all([
      prisma.user.count(),
      prisma.drug.count(),
    ]);
    return NextResponse.json({ users, drugs });
  } catch (e: any) {
    const status = e?.status || 500;
    return new NextResponse(e?.message || "Failed", { status });
  }
}

