import { Router } from 'express';
import { prisma } from '../prismaClient';
import { defaultStages } from '../defaultData';

const router = Router();

async function ensureDefaultStages() {
  await Promise.all(
    defaultStages.map(stage =>
      prisma.stageConfig.upsert({
        where: { id: stage.id },
        update: {
          name: stage.name,
          order: stage.order,
          rolesAllowed: stage.rolesAllowed,
          ...(stage.name === 'A2B Readiness Check' ? { isEnabled: true } : {}),
        },
        create: stage,
      })
    )
  );
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

// Update the complete configuration atomically.
router.put('/', async (req, res) => {
  const requestedStages = req.body?.stages;
  if (!Array.isArray(requestedStages) || requestedStages.length === 0) {
    return res.status(400).json({ error: 'At least one stage is required' });
  }

  const ids = new Set<string>();
  for (const stage of requestedStages) {
    if (!stage || typeof stage.id !== 'string' || ids.has(stage.id)) {
      return res.status(400).json({ error: 'Every stage must have a unique id' });
    }
    if (typeof stage.isEnabled !== 'boolean') {
      return res.status(400).json({ error: `isEnabled must be true or false for ${stage.id}` });
    }
    if (stage.id === 'stage-7' && stage.isEnabled === false) {
      return res.status(400).json({ error: 'A2B Readiness Check is mandatory and cannot be disabled.' });
    }
    ids.add(stage.id);
  }

  try {
    const existingCount = await prisma.stageConfig.count({ where: { id: { in: [...ids] } } });
    if (existingCount !== ids.size) {
      return res.status(400).json({ error: 'The configuration contains an unknown stage' });
    }

    await prisma.$transaction(
      requestedStages.map(stage =>
        prisma.stageConfig.update({
          where: { id: stage.id },
          data: { isEnabled: stage.isEnabled },
        })
      )
    );
    const saved = await prisma.stageConfig.findMany({ orderBy: { order: 'asc' } });
    return res.json(saved);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save stage configuration' });
  }
});

// Update a stage configuration
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, isEnabled, configOptions, rolesAllowed, order } = req.body;
  
  try {
    const data: {
      name?: string;
      isEnabled?: boolean;
      configOptions?: string | null;
      rolesAllowed?: string;
      order?: number;
    } = {};

    if (typeof name === 'string') data.name = name;
    if (id === 'stage-7' && isEnabled === false) {
      return res.status(400).json({ error: 'A2B Readiness Check is mandatory and cannot be disabled.' });
    }
    if (typeof isEnabled === 'boolean') data.isEnabled = isEnabled;
    if (configOptions !== undefined) {
      data.configOptions = typeof configOptions === 'string' || configOptions === null
        ? configOptions
        : JSON.stringify(configOptions);
    }
    if (rolesAllowed !== undefined) {
      data.rolesAllowed = Array.isArray(rolesAllowed) ? JSON.stringify(rolesAllowed) : String(rolesAllowed);
    }
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
