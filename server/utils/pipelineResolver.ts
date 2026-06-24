import { prisma } from '../index';

export async function resolveNextStage(currentStage: string): Promise<string | null> {
  // Get all active stages ordered by their execution order
  const stages = await prisma.stageConfig.findMany({
    where: { isEnabled: true },
    orderBy: { order: 'asc' },
  });

  const currentIndex = stages.findIndex(s => s.name === currentStage);
  
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return null; // Pipeline finished or current stage not found
  }

  return stages[currentIndex + 1].name;
}
