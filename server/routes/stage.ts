import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

const defaultStages = [
  { id: 'stage-1', name: 'Intake', order: 1, isEnabled: true, rolesAllowed: JSON.stringify(['Business User']) },
  { id: 'stage-2', name: 'Classification', order: 2, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-3', name: 'Qualification', order: 3, isEnabled: true, rolesAllowed: JSON.stringify(['System', 'Automation COE Analyst']) },
  { id: 'stage-4', name: 'Scoring', order: 4, isEnabled: true, rolesAllowed: JSON.stringify(['System']) },
  { id: 'stage-5', name: 'Discovery', order: 5, isEnabled: true, rolesAllowed: JSON.stringify(['Business User', 'Solution Architect']) },
  { id: 'stage-6', name: 'PRD Creation', order: 6, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Solution Architect']) },
  { id: 'stage-7', name: 'Solution Designed', order: 7, isEnabled: true, rolesAllowed: JSON.stringify(['Solution Architect']) },
  { id: 'stage-8', name: 'ROI Approved', order: 8, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner', 'Finance']) },
  { id: 'stage-9', name: 'Prioritized', order: 9, isEnabled: true, rolesAllowed: JSON.stringify(['Automation COE Analyst', 'Product Owner']) },
  { id: 'stage-10', name: 'Pod Allocated', order: 10, isEnabled: true, rolesAllowed: JSON.stringify(['Product Owner']) },
  { id: 'stage-11', name: 'Sprint Ready', order: 11, isEnabled: true, rolesAllowed: JSON.stringify(['Scrum Master', 'Pod Lead']) },
];

async function ensureDefaultStages() {
  const count = await prisma.stageConfig.count();

  if (count > 0) return;

  await prisma.stageConfig.createMany({
    data: defaultStages,
  });
}

// Get all stage configurations
router.get('/', async (req, res) => {
  try {
    await ensureDefaultStages();
    const stages = await prisma.stageConfig.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(stages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

// Update a stage configuration
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { isEnabled, configOptions, rolesAllowed, order } = req.body;
  
  try {
    const data: {
      isEnabled?: boolean;
      configOptions?: string | null;
      rolesAllowed?: string;
      order?: number;
    } = {};

    if (typeof isEnabled === 'boolean') data.isEnabled = isEnabled;
    if (typeof configOptions === 'string' || configOptions === null) data.configOptions = configOptions;
    if (typeof rolesAllowed === 'string') data.rolesAllowed = rolesAllowed;
    if (typeof order === 'number') data.order = order;

    const updated = await prisma.stageConfig.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

export default router;
