import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, pharmacyId } = await req.json();
    if (!email || !pharmacyId) return new NextResponse("Missing email or pharmacyId", { status: 400 });
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) return new NextResponse("Pharmacy not found", { status: 404 });
    // In a real system, send a verification email and persist a token.
    // Here we just record intent in audit log.
    await prisma.auditLog.create({ data: { action: "CLAIM_REQUEST", entity: `pharmacy:${pharmacyId}`, delta: { email } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e.message || "Failed to start claim", { status: 400 });
  }
}

