import { prisma } from '../prismaClient';

const stageAliases = new Map<string, string>([
  ['Intake', 'Submitted'],
  ['Submitted', 'Submitted'],
  ['Classification', 'Classified'],
  ['Classified', 'Classified'],
  ['Qualification', 'Qualified'],
  ['Qualified', 'Qualified'],
  ['Scoring', 'Scored'],
  ['Scored', 'Scored'],
  ['Discovery', 'Discovery'],
  ['PDD Creation', 'PDD Creation'],
  ['PRD Creation', 'PDD Creation'],
  ['SDD Creation', 'SDD Creation'],
  ['Solution Design', 'SDD Creation'],
  ['Solution Designed', 'SDD Creation'],
  ['ROI', 'ROI Approved'],
  ['ROI Approved', 'ROI Approved'],
  ['Prioritization', 'Prioritized'],
  ['Prioritized', 'Prioritized'],
  ['Pod Allocation', 'Pod Allocated'],
  ['Pod Allocated', 'Pod Allocated'],
  ['Sprint Readiness', 'Sprint Ready'],
  ['Sprint Ready', 'Sprint Ready'],
]);

const normalizeStage = (stage: string) => stageAliases.get(stage) ?? stage;

export async function resolveNextStage(currentStage: string): Promise<string | null> {
  const stages = await prisma.stageConfig.findMany({
    orderBy: { order: 'asc' },
  });
  const normalizedCurrentStage = normalizeStage(currentStage);
  const currentIndex = stages.findIndex(s => normalizeStage(s.name) === normalizedCurrentStage);

  if (currentIndex === -1) {
    return stages.find(s => s.isEnabled)?.name ?? null;
  }

  return stages.slice(currentIndex + 1).find(s => s.isEnabled)?.name ?? null;
}
