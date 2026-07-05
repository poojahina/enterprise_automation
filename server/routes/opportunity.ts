import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { prisma } from '../prismaClient';
import { resolveNextStage } from '../utils/pipelineResolver';
import { normalizeOpportunityPayload, parseOpportunityData } from '../utils/opportunityMapper';
import { invalidateA2B } from '../services/a2bGate';

const router = Router();

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function appendAuditTrail(
  opportunity: Record<string, unknown>,
  action: string,
  details: string,
  performedBy = 'System',
  role = 'System'
): Record<string, unknown> {
  const auditTrail = Array.isArray(opportunity.auditTrail) ? opportunity.auditTrail : [];

  return {
    ...opportunity,
    auditTrail: [
      ...auditTrail,
      {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        performedBy,
        role,
        details,
        stage: opportunity.currentStage ?? 'Submitted',
      },
    ],
  };
}

// Get all opportunities
router.get('/', async (_req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    res.json(opportunities.map(parseOpportunityData));
  } catch (error) {
    console.error('Failed to fetch opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get one opportunity
router.get('/:id', async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(parseOpportunityData(opportunity));
  } catch (error) {
    console.error('Failed to fetch opportunity:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Create a new opportunity
router.post('/', async (req, res) => {
  try {
    const payload = normalizeOpportunityPayload(toRecord(req.body));
    const id = typeof payload.id === 'string' && payload.id.trim() ? payload.id : randomUUID();
    const processName = typeof payload.processName === 'string' && payload.processName.trim()
      ? payload.processName
      : 'Untitled automation opportunity';
    const currentStage = String(payload.currentStage);
    const status = String(payload.status);
    const data = appendAuditTrail(
      { ...payload, id, processName, currentStage, status, pipelineStatus: status },
      'Opportunity Created',
      `Created opportunity "${processName}"`,
      typeof payload.submittedBy === 'string' ? payload.submittedBy : 'System',
      'Business User'
    );

    const created = await prisma.opportunity.create({
      data: {
        id,
        processName,
        currentStage,
        status,
        data: JSON.stringify(data),
      },
    });

    res.status(201).json(parseOpportunityData(created));
  } catch (error) {
    console.error('Failed to create opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update an opportunity
router.put('/:id', async (req, res) => {
  try {
    const current = await prisma.opportunity.findUnique({ where: { id: req.params.id } });

    if (!current) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const currentData = parseOpportunityData(current);
    const updates = toRecord(req.body);
    if ((updates.currentStage === 'SDD Creation' || updates.solution != null) && !(current as any).sddEnabled) {
      return res.status(409).json({ error: 'SDD changes are blocked until A2B is READY or overridden.', code: 'A2B_NOT_READY' });
    }
    let updatedData = appendAuditTrail(
      normalizeOpportunityPayload({ ...currentData, ...updates, id: current.id }),
      'Opportunity Updated',
      'Updated opportunity details',
      typeof updates.performedBy === 'string' ? updates.performedBy : 'System',
      typeof updates.role === 'string' ? updates.role : 'System'
    );
    const invalidatesReadiness = updates.pdd != null || updates.discovery != null;
    if (invalidatesReadiness) updatedData = await invalidateA2B(current.id, updatedData);

    const updated = await prisma.opportunity.update({
      where: { id: req.params.id },
      data: {
        processName: String(updatedData.processName ?? current.processName),
        currentStage: String(updatedData.currentStage ?? current.currentStage),
        status: String(updatedData.status ?? updatedData.pipelineStatus ?? current.status),
        ...(invalidatesReadiness ? { a2bStatus: 'NOT_RUN', a2bLastRunId: null, sddEnabled: false } : {}),
        data: JSON.stringify(updatedData),
      },
    });

    res.json(parseOpportunityData(updated));
  } catch (error) {
    console.error('Failed to update opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Move to the next enabled workflow stage
router.post('/:id/advance', async (req, res) => {
  try {
    const current = await prisma.opportunity.findUnique({ where: { id: req.params.id } });

    if (!current) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const nextStage = await resolveNextStage(current.currentStage);

    if (!nextStage) {
      return res.status(400).json({ error: 'No next enabled stage is available' });
    }
    if (nextStage === 'SDD Creation' && !(current as any).sddEnabled) {
      return res.status(409).json({ error: 'Cannot advance to SDD until A2B is READY or overridden.', code: 'A2B_NOT_READY' });
    }

    const currentData = parseOpportunityData(current);
    const updatedData = appendAuditTrail(
      { ...currentData, currentStage: nextStage },
      'Stage Advanced',
      `Moved from ${current.currentStage} to ${nextStage}`,
      typeof req.body?.performedBy === 'string' ? req.body.performedBy : 'System',
      typeof req.body?.role === 'string' ? req.body.role : 'System'
    );

    const updated = await prisma.opportunity.update({
      where: { id: req.params.id },
      data: {
        currentStage: nextStage,
        data: JSON.stringify(updatedData),
      },
    });

    res.json(parseOpportunityData(updated));
  } catch (error) {
    console.error('Failed to advance opportunity:', error);
    res.status(500).json({ error: 'Failed to advance opportunity' });
  }
});

// Delete an opportunity
router.delete('/:id', async (req, res) => {
  try {
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

export default router;
