import { prisma } from '../prismaClient';

export async function invalidateA2B(projectId: string, data: Record<string, any>) {
  await (prisma as any).a2BOverride.updateMany({
    where: { projectId, isActive: true },
    data: { isActive: false, invalidatedAt: new Date() },
  });
  return { ...data, a2bStatus: 'NOT_RUN', a2bLastRunId: null, sddEnabled: false };
}
