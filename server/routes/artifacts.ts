import { Router } from 'express';
import { prisma } from '../prismaClient';
import { runWorkflowAction } from '../services/workflowEngine';
import { parseOpportunityData } from '../utils/opportunityMapper';
import { invalidateA2B } from '../services/a2bGate';

const router = Router();

const artifacts: Record<string, { action: string; property: string }> = {
  pdd: { action: 'apply-pdd', property: 'pdd' },
  sdd: { action: 'generate-solution', property: 'solution' },
  'user-stories': { action: 'generate-backlog', property: 'backlogItems' },
};

router.post('/:opportunityId/:artifactType/generate', async (req, res) => {
  try {
    const config = artifacts[req.params.artifactType];
    if (!config) return res.status(400).json({ error: 'Unsupported artifact type' });
    const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.opportunityId } });
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    if (req.params.artifactType === 'sdd' && !(opportunity as any).sddEnabled)
      return res.status(409).json({ error: 'SDD generation is blocked until A2B is READY or overridden.', code: 'A2B_NOT_READY' });

    let updatedData = runWorkflowAction(parseOpportunityData(opportunity), config.action, req.body ?? {});
    if (config.action === 'apply-pdd') updatedData = await invalidateA2B(opportunity.id, updatedData);
    const updated = await prisma.opportunity.update({
      where: { id: req.params.opportunityId },
      data: {
        processName: String(updatedData.processName ?? opportunity.processName),
        currentStage: String(updatedData.currentStage ?? opportunity.currentStage),
        status: String(updatedData.status ?? opportunity.status),
        ...(config.action === 'apply-pdd' ? { a2bStatus: 'NOT_RUN', a2bLastRunId: null, sddEnabled: false } : {}),
        data: JSON.stringify(updatedData),
      },
    });
    return res.json(parseOpportunityData(updated));
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Artifact generation failed' });
  }
});

router.get('/:opportunityId/:artifactType', async (req, res) => {
  const config = artifacts[req.params.artifactType];
  if (!config) return res.status(400).json({ error: 'Unsupported artifact type' });
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.opportunityId } });
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
  const artifact = parseOpportunityData(opportunity)[config.property];
  return artifact == null
    ? res.status(404).json({ error: 'Artifact has not been generated' })
    : res.json(artifact);
});

export default router;
