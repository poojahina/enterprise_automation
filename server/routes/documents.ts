import { Router } from 'express';
import { prisma } from '../prismaClient';
import { parseOpportunityData } from '../utils/opportunityMapper';
import { generateDocument } from '../services/workflowEngine';

const router = Router();

router.get('/:opportunityId/:docType/export', async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.opportunityId } });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const text = generateDocument(parseOpportunityData(opportunity), req.params.docType);
    const fileName = `${req.params.opportunityId}-${req.params.docType}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(text);
  } catch (error) {
    console.error('Document export failed:', error);
    res.status(500).json({ error: 'Document export failed' });
  }
});

export default router;
