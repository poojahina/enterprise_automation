import { Router } from 'express';
import { prisma } from '../prismaClient';
import { parseOpportunityData } from '../utils/opportunityMapper';
import { runWorkflowAction } from '../services/workflowEngine';

const router = Router();

router.post('/opportunities/:id/actions/:action', async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const currentData = parseOpportunityData(opportunity);
    const updatedData = runWorkflowAction(currentData, req.params.action, req.body ?? {});

    const updated = await prisma.opportunity.update({
      where: { id: req.params.id },
      data: {
        processName: String(updatedData.processName ?? opportunity.processName),
        currentStage: String(updatedData.currentStage ?? opportunity.currentStage),
        status: String(updatedData.status ?? opportunity.status),
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
