import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FlagEntityType } from "@prisma/client";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit("flags:post", ip, 10, 60_000)) return new NextResponse("Rate limit exceeded", { status: 429 });
    const { entityType, entityId, reason } = await req.json();
    if (!entityType || !entityId || !reason) return new NextResponse("Missing fields", { status: 400 });
    if (!Object.values(FlagEntityType).includes(entityType)) return new NextResponse("Invalid entityType", { status: 400 });
    const flag = await prisma.flag.create({ data: { entityType, entityId, reason, createdById: (await ensureAnonUser()).id } });
    return NextResponse.json({ ok: true, flag });
  } catch (e: any) {
    return new NextResponse(e.message || "Failed to create flag", { status: 400 });
  }
}

async function ensureAnonUser() {
  // Minimal placeholder user to satisfy relation; in production, tie to real user or null.
  const email = "anon@example.com";
  const u = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
  return u;
}

