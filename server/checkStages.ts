import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.stageConfig.findMany();
  console.log("Found stages:", stages);
  
  if (stages.length === 0) {
    console.log("No stages found. Seeding now...");
    const defaultStages = [
      { id: '1', name: 'Intake', order: 1, isEnabled: true, rolesAllowed: '["Business User", "Automation CoE"]' },
      { id: '2', name: 'Classification', order: 2, isEnabled: true, rolesAllowed: '["Automation CoE"]' },
      { id: '3', name: 'Qualification', order: 3, isEnabled: true, rolesAllowed: '["Automation CoE", "Business User"]' },
      { id: '4', name: 'Scoring', order: 4, isEnabled: true, rolesAllowed: '["Automation CoE"]' },
      { id: '5', name: 'Discovery', order: 5, isEnabled: true, rolesAllowed: '["Business Analyst", "Process Owner"]' },
      { id: '6', name: 'PRD Creation', order: 6, isEnabled: true, rolesAllowed: '["Business Analyst"]' },
      { id: '7', name: 'Solution Designed', order: 7, isEnabled: true, rolesAllowed: '["Solution Architect"]' },
      { id: '8', name: 'ROI Approved', order: 8, isEnabled: true, rolesAllowed: '["Finance", "Automation CoE"]' },
      { id: '9', name: 'Prioritized', order: 9, isEnabled: true, rolesAllowed: '["Steering Committee"]' },
      { id: '10', name: 'Pod Allocated', order: 10, isEnabled: true, rolesAllowed: '["Delivery Manager"]' },
      { id: '11', name: 'Sprint Ready', order: 11, isEnabled: true, rolesAllowed: '["Scrum Master"]' },
    ];
    for (const stage of defaultStages) {
      await prisma.stageConfig.create({ data: stage });
    }
    console.log("Seeded default stages.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
