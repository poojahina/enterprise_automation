import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all integration configurations
router.get('/', async (req, res) => {
  try {
    const integrations = await prisma.integrationConfig.findMany();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Update integration config (e.g. toggle active)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { isActive, credentials } = req.body;
  
  try {
    const updated = await prisma.integrationConfig.update({
      where: { id },
      data: { isActive, credentials },
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
    res.json({ success: true, message: `Synchronized ${items.length} items to Azure DevOps` });
  } catch (error) {
    res.status(500).json({ error: 'Azure DevOps sync failed' });
  }
});

export default router;
