import type { Opportunity } from '@prisma/client';

export function parseOpportunityData(opportunity: Opportunity) {
  const data = JSON.parse(opportunity.data);

  return {
    ...data,
    id: opportunity.id,
    processName: opportunity.processName,
    currentStage: opportunity.currentStage,
    status: opportunity.status,
    pipelineStatus: opportunity.status,
    a2bStatus: (opportunity as Opportunity & { a2bStatus?: string }).a2bStatus ?? data.a2bStatus ?? 'NOT_RUN',
    a2bLastRunId: (opportunity as Opportunity & { a2bLastRunId?: string | null }).a2bLastRunId ?? data.a2bLastRunId ?? null,
    sddEnabled: (opportunity as Opportunity & { sddEnabled?: boolean }).sddEnabled ?? data.sddEnabled ?? false,
  };
}

export function normalizeOpportunityPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    ...payload,
    currentStage: payload.currentStage ?? 'Submitted',
    status: payload.status ?? payload.pipelineStatus ?? 'Active',
    submittedDate: payload.submittedDate ?? new Date().toISOString(),
    backlogItems: payload.backlogItems ?? [],
    complianceChecks: payload.complianceChecks ?? [],
    auditTrail: payload.auditTrail ?? [],
    a2bStatus: payload.a2bStatus ?? 'NOT_RUN',
    sddEnabled: payload.sddEnabled ?? false,
  };
}
