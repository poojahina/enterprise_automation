import { Router } from 'express';
import { prisma } from '../prismaClient';
import { runWorkflowAction } from '../services/workflowEngine';
import { parseOpportunityData } from '../utils/opportunityMapper';

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

    const updatedData = runWorkflowAction(parseOpportunityData(opportunity), config.action, req.body ?? {});
    const updated = await prisma.opportunity.update({
      where: { id: req.params.opportunityId },
      data: {
        processName: String(updatedData.processName ?? opportunity.processName),
        currentStage: String(updatedData.currentStage ?? opportunity.currentStage),
        status: String(updatedData.status ?? opportunity.status),
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
