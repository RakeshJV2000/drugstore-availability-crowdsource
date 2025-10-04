import { prisma } from "../lib/prisma.ts";
import { ReportSource, ReportStatus } from "@prisma/client";
import { recomputeAggregate } from "../lib/aggregate.ts";

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number) { return Math.random() * (max - min) + min; }
function sample<T>(arr: T[], n: number) {
  const copy = [...arr];
  const out: T[] = [];
  n = Math.min(n, copy.length);
  for (let i = 0; i < n; i++) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  return out;
}
function pickStatus(): ReportStatus {
  const r = Math.random();
  if (r < 0.5) return "IN_STOCK";
  if (r < 0.7) return "LOW";
  if (r < 0.95) return "OUT";
  return "UNKNOWN";
}
function randomRecentDate(days = 7) {
  const now = Date.now();
  const past = now - days * 24 * 3600 * 1000;
  return new Date(randInt(past, now));
}

async function main() {
  // 50 common-ish drugs
  const drugNames = [
    "Amoxicillin","Ibuprofen","Acetaminophen","Atorvastatin","Amlodipine","Lisinopril","Levothyroxine","Metformin","Omeprazole","Simvastatin",
    "Losartan","Gabapentin","Hydrochlorothiazide","Sertraline","Zolpidem","Azithromycin","Ciprofloxacin","Clopidogrel","Doxycycline","Fluconazole",
    "Furosemide","Albuterol","Prednisone","Pantoprazole","Escitalopram","Tramadol","Tamsulosin","Warfarin","Bupropion","Venlafaxine",
    "Cetirizine","Naproxen","Meloxicam","Topiramate","Propranolol","Citalopram","Duloxetine","Allopurinol","Montelukast","Spironolactone",
    "Ranitidine","Metoprolol","Hydrocodone","Rosuvastatin","Lamotrigine","Quetiapine","Aripiprazole","Mirtazapine","Buspirone","Cyclobenzaprine"
  ];

  const drugs = await Promise.all(drugNames.map(async (name, i) =>
    prisma.drug.upsert({ where: { name }, update: {}, create: { name, ndc: `${10000 + i}-${1000 + i}` } })
  ));

  // NYC and Jersey City bounding boxes
  const NYC = { minLat: 40.55, maxLat: 40.90, minLng: -74.05, maxLng: -73.70 };
  const JC = { minLat: 40.68, maxLat: 40.75, minLng: -74.10, maxLng: -74.03 };
  const areas = [NYC, NYC, NYC, JC]; // bias towards NYC

  const brands = ["Walgreens", "CVS", "Rite Aid", "Duane Reade", "CityCare", "HealthHub", "Metro Pharmacy", "Hudson Pharmacy", "Liberty Pharmacy", "Park Ave Pharmacy"];
  const hoods = [
    "Midtown", "Chelsea", "SoHo", "Tribeca", "Upper East Side", "Upper West Side", "Harlem", "Financial District", "East Village", "West Village",
    "Long Island City", "Williamsburg", "Greenpoint", "Astoria", "Downtown Brooklyn",
    "Downtown Jersey City", "Journal Square", "Newport", "Grove Street", "Hamilton Park"
  ];

  const pharmacies = [] as { id: string; name: string; address: string; lat: number; lng: number }[];
  for (let i = 0; i < 50; i++) {
    const area = areas[randInt(0, areas.length - 1)];
    const lat = randFloat(area.minLat, area.maxLat);
    const lng = randFloat(area.minLng, area.maxLng);
    const brand = brands[randInt(0, brands.length - 1)];
    const hood = hoods[randInt(0, hoods.length - 1)];
    const city = (lng < -74.05 ? "Jersey City" : "New York") + ", NY";
    const name = `${brand} ${hood}`;
    const id = `pharm-${i + 1}`;
    pharmacies.push({ id, name, address: `${hood}, ${city}`, lat, lng });
  }

  for (const p of pharmacies) {
    await prisma.pharmacy.upsert({ where: { id: p.id }, update: { name: p.name, address: p.address, lat: p.lat, lng: p.lng }, create: p });
  }

  // Create availability reports per store for a subset of drugs, then recompute aggregates
  for (const p of pharmacies) {
    const chosen = sample(drugs, randInt(8, 12));
    for (const d of chosen) {
      const reportCount = randInt(1, 3);
      for (let r = 0; r < reportCount; r++) {
        await prisma.availabilityReport.create({
          data: {
            drugId: d.id,
            pharmacyId: p.id,
            status: pickStatus(),
            source: ReportSource.PUBLIC,
            createdAt: randomRecentDate(10)
          }
        });
      }
      await recomputeAggregate(prisma, d.id, p.id);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
