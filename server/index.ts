import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import stageRoutes from './routes/stage';
import llmRoutes from './routes/llm';
import integrationRoutes from './routes/integrations';
import opportunityRoutes from './routes/opportunity';
import contextRoutes from './routes/context';
import workflowRoutes from './routes/workflow';
import documentRoutes from './routes/documents';
import artifactRoutes from './routes/artifacts';
import a2bRoutes from './routes/a2b';
import { prisma } from './prismaClient';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stages', stageRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/context', contextRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api', a2bRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const server = app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
