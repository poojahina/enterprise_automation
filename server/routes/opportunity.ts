import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all opportunities
router.get('/', async (req, res) => {
  try {
    const opps = await prisma.opportunity.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    // Parse the JSON data back into object form
    const parsedOpps = opps.map(opp => {
      const data = JSON.parse(opp.data);
      return {
        ...data,
        id: opp.id,
        currentStage: opp.currentStage,
        status: opp.status
      };
    });
    res.json(parsedOpps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Create a new opportunity
router.post('/', async (req, res) => {
  try {
    const opp = req.body;
    
    const newOpp = await prisma.opportunity.create({
      data: {
        id: opp.id,
        processName: opp.processName,
        currentStage: opp.currentStage,
        status: opp.status || 'Active',
        data: JSON.stringify(opp),
      }
    });
    res.json({
      ...opp,
      id: newOpp.id,
      currentStage: newOpp.currentStage,
      status: newOpp.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update an opportunity
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch current to merge data
    const current = await prisma.opportunity.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Not found' });

    const currentData = JSON.parse(current.data);
    const updatedData = { ...currentData, ...req.body };

    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        processName: updatedData.processName,
        currentStage: updatedData.currentStage,
        status: updatedData.status || 'Active',
        data: JSON.stringify(updatedData),
      }
    });

    res.json({ ...updatedData, id: updated.id, currentStage: updated.currentStage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

export default router;
