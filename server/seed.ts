import { PrismaClient } from '@prisma/client';
import { defaultIntegrations, defaultStages } from './defaultData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding stages...');
  for (const stage of defaultStages) {
    await prisma.stageConfig.upsert({
      where: { id: stage.id },
      update: stage,
      create: stage,
    });
  }

  // Also seed some default IntegrationConfigs
  for (const int of defaultIntegrations) {
    await prisma.integrationConfig.upsert({
      where: { id: int.id },
      update: int,
      create: int,
    });
  }
  
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
