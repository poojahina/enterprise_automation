import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../index';
import { parseDocument } from '../services/documentParser';

const router = Router();

// Configure multer for memory storage (for simulated parsing)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  const { opportunityId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!opportunityId) {
    return res.status(400).json({ error: 'Missing opportunityId' });
  }

  try {
    // Simulate document parsing / OCR / Extraction
    const extractedContext = await parseDocument(file.buffer, file.mimetype);

    const document = await prisma.document.create({
      data: {
        opportunityId,
        fileName: file.originalname,
        fileType: file.mimetype,
        content: file.buffer.toString('base64'), // Store binary in DB for mock purposes
        extractedContext,
      }
    });

    res.json({ success: true, document });
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});

router.get('/:opportunityId', async (req, res) => {
  const { opportunityId } = req.params;
  try {
    const docs = await prisma.document.findMany({
      where: { opportunityId },
      select: { id: true, fileName: true, fileType: true, uploadedAt: true, extractedContext: true }
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;
