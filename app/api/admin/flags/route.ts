import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/request";

export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const flags = await prisma.flag.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ flags });
  } catch (e: any) {
    const status = e.status || 400;
    return new NextResponse(e.message || "Failed to list flags", { status });
  }
}

