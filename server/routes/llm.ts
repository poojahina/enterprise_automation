import { Router } from 'express';
import { prisma } from '../prismaClient';

const router = Router();

// Mock LLM Generation
router.post('/generate', async (req, res) => {
  const { prompt, provider, context } = req.body;
  
  // Here we would implement the actual LLM Gateway logic
  // For the sake of this mock, we will return a simulated response based on the prompt
  
  try {
    // Check if the provider is configured and active
    const config = await prisma.integrationConfig.findFirst({
      where: { provider: provider || 'AzureOpenAI', isActive: true }
    });

    if (!config) {
      // Degrade gracefully to a default mock if no config found, or throw an error depending on strictness
      console.warn(`No active configuration found for provider ${provider}. Using mock fallback.`);
    }

    let result = '';

    if (prompt.includes('process steps')) {
      result = '1. Receive invoice via email.\n2. Extract data using OCR.\n3. Validate against PO.\n4. Enter into SAP.';
    } else if (prompt.includes('requirements')) {
      result = 'FR1: System must extract invoice number.\nFR2: System must validate PO number.\nNFR1: Processing must take < 5s.';
    } else if (prompt.includes('architecture')) {
      result = 'Use Document Intelligence for OCR.\nUse Logic Apps for workflow.\nStore data in Azure SQL.';
    } else if (prompt.includes('team')) {
      result = 'Recommended Pod: Intelligent Automation Squad.\nRequired Skills: Python, OCR, API Integration.\nEstimated Effort: 3 Sprints.';
    } else {
      result = 'Generated AI response based on the provided context.';
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({ result, provider: provider || 'AzureOpenAI (Mock)' });
  } catch (error) {
    res.status(500).json({ error: 'LLM Generation failed' });
  }
});

export default router;
