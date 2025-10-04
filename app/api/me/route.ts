import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateSessionUser();
    return NextResponse.json({ user });
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed", { status: 500 });
  }
}

