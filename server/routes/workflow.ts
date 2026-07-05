import { Router } from 'express';
import { prisma } from '../prismaClient';
import { parseOpportunityData } from '../utils/opportunityMapper';
import { runWorkflowAction } from '../services/workflowEngine';
import { invalidateA2B } from '../services/a2bGate';

const router = Router();

router.post('/opportunities/:id/actions/:action', async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    if (req.params.action === 'generate-solution' && !(opportunity as any).sddEnabled) {
      return res.status(409).json({ error: 'SDD generation is blocked until A2B is READY or overridden.', code: 'A2B_NOT_READY' });
    }

    const currentData = parseOpportunityData(opportunity);
    let updatedData = runWorkflowAction(currentData, req.params.action, req.body ?? {});
    if (req.params.action === 'apply-pdd') updatedData = await invalidateA2B(opportunity.id, updatedData);

    const updated = await prisma.opportunity.update({
      where: { id: req.params.id },
      data: {
        processName: String(updatedData.processName ?? opportunity.processName),
        currentStage: String(updatedData.currentStage ?? opportunity.currentStage),
        status: String(updatedData.status ?? opportunity.status),
        ...(req.params.action === 'apply-pdd' ? { a2bStatus: 'NOT_RUN', a2bLastRunId: null, sddEnabled: false } : {}),
        data: JSON.stringify(updatedData),
      },
    });

    res.json(parseOpportunityData(updated));
  } catch (error) {
    console.error('Workflow action failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Workflow action failed' });
  }
});

export default router;
