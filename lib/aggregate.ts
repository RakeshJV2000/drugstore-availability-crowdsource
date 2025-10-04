import { PrismaClient, ReportSource, ReportStatus } from "@prisma/client";

const SOURCE_WEIGHTS: Record<ReportSource, number> = {
  PUBLIC: 1,
  STAFF: 3,
  IMPORT: 2
};

function hoursSince(date: Date) {
  return (Date.now() - date.getTime()) / 1000 / 3600;
}

export async function recomputeAggregate(prisma: PrismaClient, drugId: string, pharmacyId: string) {
  const reports = await prisma.availabilityReport.findMany({
    where: { drugId, pharmacyId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  if (reports.length === 0) return null;

  const scores: Record<ReportStatus, number> = {
    IN_STOCK: 0,
    LOW: 0,
    OUT: 0,
    UNKNOWN: 0
  };

  for (const r of reports) {
    const ageH = hoursSince(r.createdAt);
    const decay = Math.max(0.2, 1 - ageH / 72); // linear decay, floor at 0.2 over 3 days
    const weight = SOURCE_WEIGHTS[r.source] * decay;
    scores[r.status] += weight;
  }

  let status: ReportStatus = "UNKNOWN";
  let best = -Infinity;
  for (const key of Object.keys(scores) as ReportStatus[]) {
    if (scores[key] > best) {
      best = scores[key];
      status = key;
    }
  }

  const confidence = Math.min(1, best / 5); // crude normalization
  const lastVerifiedAt = reports[0].createdAt;

  await prisma.statusAggregate.upsert({
    where: { drugId_pharmacyId: { drugId, pharmacyId } },
    create: { drugId, pharmacyId, status, confidence, lastVerifiedAt },
    update: { status, confidence, lastVerifiedAt }
  });

  return { status, confidence, lastVerifiedAt };
}

