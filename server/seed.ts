import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stages = [
  { id: 'stage-1', name: 'Intake', order: 1, isEnabled: true, rolesAllowed: JSON.stringify(['Business User']) },
  { id: 'stage-2', name: 'Classification', order: 2, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-3', name: 'Qualification', order: 3, isEnabled: true, rolesAllowed: JSON.stringify(['System', 'Automation COE Analyst']) },
  { id: 'stage-4', name: 'Scoring', order: 4, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-5', name: 'Discovery', order: 5, isEnabled: true, rolesAllowed: JSON.stringify(['Business User', 'Solution Architect']) },
  { id: 'stage-6', name: 'PRD Creation', order: 6, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Solution Architect']) },
  { id: 'stage-7', name: 'Solution Designed', order: 7, isEnabled: true, rolesAllowed: JSON.stringify(['Solution Architect']) },
  { id: 'stage-8', name: 'ROI Approved', order: 8, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Finance']) },
  { id: 'stage-9', name: 'Prioritized', order: 9, isEnabled: true, rolesAllowed: JSON.stringify(['Automation COE Analyst', 'Product Owner']) },
  { id: 'stage-10', name: 'Pod Allocated', order: 10, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner']) },
  { id: 'stage-11', name: 'Sprint Ready', order: 11, isEnabled: true, rolesAllowed: JSON.stringify(['Scrum Master', 'Pod Lead']) }
];

async function main() {
  console.log('Seeding stages...');
  for (const stage of stages) {
    await prisma.stageConfig.upsert({
      where: { id: stage.id },
      update: stage,
      create: stage,
    });
  }

  // Also seed some default IntegrationConfigs
  const integrations = [
    { id: 'int-1', provider: 'AzureOpenAI', isActive: true, credentials: '{"apiKey":"MOCK_AZURE_KEY"}' },
    { id: 'int-2', provider: 'AWSBedrock', isActive: false, credentials: '{"apiKey":"MOCK_AWS_KEY"}' },
    { id: 'int-3', provider: 'GoogleVertex', isActive: false, credentials: '{"apiKey":"MOCK_GCP_KEY"}' },
    { id: 'int-4', provider: 'SharePoint', isActive: false, credentials: '{"token":"MOCK_SP_TOKEN"}' },
    { id: 'int-5', provider: 'AzureDevOps', isActive: false, credentials: '{"pat":"MOCK_ADO_PAT"}' }
  ];

  for (const int of integrations) {
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
