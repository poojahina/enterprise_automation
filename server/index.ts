import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import stageRoutes from './routes/stage';
import llmRoutes from './routes/llm';
import integrationRoutes from './routes/integrations';
import opportunityRoutes from './routes/opportunity';
import contextRoutes from './routes/context';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stages', stageRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/context', contextRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
