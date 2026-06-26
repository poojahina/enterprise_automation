import { PrismaClient } from '@prisma/client';
import { defaultStages } from './defaultData';
const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.stageConfig.findMany();
  console.log("Found stages:", stages);
  
  if (stages.length === 0) {
    console.log("No stages found. Seeding now...");
    for (const stage of defaultStages) {
      await prisma.stageConfig.create({ data: stage });
    }
    console.log("Seeded default stages.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
