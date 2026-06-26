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
  };
}
