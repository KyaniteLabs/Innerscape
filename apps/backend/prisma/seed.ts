import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

interface SeedItem {
  label: string;
  category: string;
  low: number;
  median: number;
  high: number;
  confidence: string;
}

async function main() {
  const seedPath = join(__dirname, 'data', 'price_seed.json');
  const items: SeedItem[] = JSON.parse(readFileSync(seedPath, 'utf-8'));

  console.log(`Seeding ${items.length} price ranges...`);

  const BATCH_SIZE = 500;
  let created = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const operations = batch.map((item) =>
      prisma.priceRange.upsert({
        where: { normalizedLabel: item.label.toLowerCase().trim() },
        update: {
          lowPrice: item.low,
          medianPrice: item.median,
          highPrice: item.high,
          confidence: item.confidence,
          compCount: 0,
          source: 'seeded',
          category: item.category,
        },
        create: {
          label: item.label,
          normalizedLabel: item.label.toLowerCase().trim(),
          category: item.category,
          lowPrice: item.low,
          medianPrice: item.median,
          highPrice: item.high,
          compCount: 0,
          source: 'seeded',
          confidence: item.confidence,
        },
      }),
    );
    await Promise.all(operations);
    created += batch.length;
    console.log(`  ${created}/${items.length}`);
  }

  console.log(`Done. ${created} price ranges seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
