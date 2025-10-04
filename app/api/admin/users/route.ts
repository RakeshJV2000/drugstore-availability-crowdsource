import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";

export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        handle: true,
        role: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
      take: 200,
    });
    return NextResponse.json({ users });
  } catch (e: any) {
    const status = e?.status || 500;
    return new NextResponse(e?.message || "Failed", { status });
  }
}

