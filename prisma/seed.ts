import { prisma } from "../lib/prisma.ts";

async function main() {
  const amox = await prisma.drug.upsert({
    where: { name: "Amoxicillin" },
    update: {},
    create: { name: "Amoxicillin", ndc: "12345-6789" }
  });

  const pharm1 = await prisma.pharmacy.upsert({
    where: { id: "pharm-1" },
    update: {},
    create: { id: "pharm-1", name: "Main Street Pharmacy", address: "123 Main St", lat: 37.7749, lng: -122.4194 }
  });

  await prisma.availabilityReport.create({ data: { drugId: amox.id, pharmacyId: pharm1.id, status: "IN_STOCK", source: "PUBLIC" as any } });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
