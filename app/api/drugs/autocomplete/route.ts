import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const results = await prisma.drug.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { ndc: q },
        { synonyms: { some: { name: { contains: q, mode: "insensitive" } } } }
      ]
    },
    take: 10
  });

  return NextResponse.json({
    results: results.map((d) => ({ id: d.id, name: d.name, ndc: d.ndc }))
  });
}

