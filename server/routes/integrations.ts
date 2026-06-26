import { Router } from 'express';
import { prisma } from '../prismaClient';
import { defaultIntegrations } from '../defaultData';

const router = Router();

async function ensureDefaultIntegrations() {
  await Promise.all(
    defaultIntegrations.map(integration =>
      prisma.integrationConfig.upsert({
        where: { id: integration.id },
        update: {},
        create: integration,
      })
    )
  );
}

// Get all integration configurations
router.get('/', async (req, res) => {
  try {
    await ensureDefaultIntegrations();
    const integrations = await prisma.integrationConfig.findMany();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Update integration config (e.g. toggle active)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { provider, isActive, credentials } = req.body;
  
  try {
    const updated = await prisma.integrationConfig.upsert({
      where: { id },
      update: {
        ...(typeof provider === 'string' ? { provider } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(credentials !== undefined ? { credentials: typeof credentials === 'string' ? credentials : JSON.stringify(credentials) } : {}),
      },
      create: {
        id,
        provider: typeof provider === 'string' ? provider : id,
        isActive: typeof isActive === 'boolean' ? isActive : false,
        credentials: credentials === undefined ? '{}' : typeof credentials === 'string' ? credentials : JSON.stringify(credentials),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// Mock SharePoint Sync
router.post('/sharepoint/sync', async (req, res) => {
  const { opportunityId, documentId } = req.body;
  
  try {
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    res.json({ success: true, message: 'Document synchronized to SharePoint' });
  } catch (error) {
    res.status(500).json({ error: 'SharePoint sync failed' });
  }
});

// Mock Azure DevOps Sync
router.post('/devops/sync', async (req, res) => {
  const { opportunityId, items } = req.body;
  
  try {
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    res.json({ success: true, message: `Synchronized ${(items ?? []).length} items to Azure DevOps`, opportunityId });
  } catch (error) {
    res.status(500).json({ error: 'Azure DevOps sync failed' });
  }
});

export default router;
