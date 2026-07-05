import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { prisma } from '../prismaClient';
import { parseOpportunityData } from '../utils/opportunityMapper';

const router = Router();
const db = prisma as any;
const severities = new Set(['mandatory', 'recommended', 'optional']);
const authorizedRoles = new Set(['Product Owner', 'Solution Architect', 'Automation COE Analyst']);

const seedCriteria = [
  ['a2b-1', 'Business process clearly documented', 'Process', 'mandatory', 'process overview steps', ['PDD', 'process']],
  ['a2b-2', 'Functional requirements complete', 'Requirements', 'mandatory', 'functional requirements business rules', ['PDD', 'BRD', 'requirements']],
  ['a2b-3', 'In-scope and out-of-scope items defined', 'Scope', 'mandatory', 'scope out of scope', ['PDD', 'BRD']],
  ['a2b-4', 'Assumptions documented', 'Governance', 'recommended', 'assumptions', ['PDD', 'BRD']],
  ['a2b-5', 'Dependencies documented', 'Governance', 'recommended', 'dependencies', ['PDD', 'BRD']],
  ['a2b-6', 'Integration points identified', 'Technical', 'mandatory', 'systems integrations', ['PDD', 'requirements']],
  ['a2b-7', 'Data requirements documented', 'Technical', 'recommended', 'inputs outputs data', ['PDD', 'requirements']],
  ['a2b-8', 'Exception scenarios documented', 'Process', 'mandatory', 'exceptions', ['PDD', 'process']],
  ['a2b-9', 'Acceptance criteria available', 'Quality', 'recommended', 'acceptance criteria', ['requirements', 'BRD']],
  ['a2b-10', 'Open questions captured', 'Governance', 'recommended', 'open items questions', ['PDD', 'attachment']],
  ['a2b-11', 'Risks and constraints documented', 'Risk', 'recommended', 'risks constraints controls', ['PDD', 'BRD']],
  ['a2b-12', 'Stakeholders/sign-off identified', 'Governance', 'optional', 'stakeholders approvals sign-off', ['PDD', 'BRD']],
] as const;

async function ensureCriteria() {
  await Promise.all(seedCriteria.map(([id, name, category, severity, expectedEvidence, types]) =>
    db.a2BReadinessCriterion.upsert({
      where: { id },
      update: {},
      create: {
        id, name, category, severity, expectedEvidence,
        description: `Verify that ${name.toLowerCase()}.`,
        applicableDocumentTypes: JSON.stringify(types),
      },
    })
  ));
}

router.get('/a2b/criteria', async (_req, res) => {
  try {
    await ensureCriteria();
    const criteria = await db.a2BReadinessCriterion.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(criteria.map(criterionDto));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load A2B criteria' });
  }
});

router.post('/a2b/criteria', async (req, res) => {
  const severity = String(req.body?.severity ?? 'recommended').toLowerCase();
  if (!req.body?.name || !req.body?.expectedEvidence || !severities.has(severity))
    return res.status(400).json({ error: 'name, expectedEvidence, and a valid severity are required.' });
  if (req.body.applicableDocumentTypes != null && !Array.isArray(req.body.applicableDocumentTypes))
    return res.status(400).json({ error: 'applicableDocumentTypes must be an array.' });
  const criterion = await db.a2BReadinessCriterion.create({
    data: {
      name: String(req.body.name), description: String(req.body.description ?? ''),
      category: String(req.body.category ?? ''), severity,
      expectedEvidence: String(req.body.expectedEvidence),
      applicableDocumentTypes: JSON.stringify(req.body.applicableDocumentTypes ?? []),
      isActive: req.body.isActive !== false,
    },
  });
  return res.status(201).json(criterionDto(criterion));
});

router.put('/a2b/criteria/:id', async (req, res) => {
  const existing = await db.a2BReadinessCriterion.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Criterion not found.' });
  const severity = req.body.severity == null ? existing.severity : String(req.body.severity).toLowerCase();
  if (!severities.has(severity)) return res.status(400).json({ error: 'Invalid severity.' });
  if (req.body.applicableDocumentTypes != null && !Array.isArray(req.body.applicableDocumentTypes))
    return res.status(400).json({ error: 'applicableDocumentTypes must be an array.' });
  const updated = await db.a2BReadinessCriterion.update({
    where: { id: req.params.id },
    data: {
      ...(req.body.name != null ? { name: String(req.body.name) } : {}),
      ...(req.body.description != null ? { description: String(req.body.description) } : {}),
      ...(req.body.category != null ? { category: String(req.body.category) } : {}),
      severity,
      ...(req.body.expectedEvidence != null ? { expectedEvidence: String(req.body.expectedEvidence) } : {}),
      ...(req.body.applicableDocumentTypes != null ? { applicableDocumentTypes: JSON.stringify(req.body.applicableDocumentTypes) } : {}),
      ...(typeof req.body.isActive === 'boolean' ? { isActive: req.body.isActive } : {}),
    },
  });
  return res.json(criterionDto(updated));
});

router.delete('/a2b/criteria/:id', async (req, res) => {
  const existing = await db.a2BReadinessCriterion.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Criterion not found.' });
  await db.a2BReadinessCriterion.update({ where: { id: req.params.id }, data: { isActive: false } });
  return res.status(204).send();
});

router.post('/projects/:projectId/a2b/run', async (req, res) => {
  try {
    await ensureCriteria();
    const project = await prisma.opportunity.findUnique({ where: { id: req.params.projectId }, include: { documents: true } });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    const criteria = await db.a2BReadinessCriterion.findMany({ where: { isActive: true } });
    if (!criteria.length) return res.status(409).json({ error: 'A2B readiness criteria are not configured.' });
    const projectData = parseOpportunityData(project);
    const sources = project.documents.map(document => ({
      id: document.id, name: document.fileName, type: inferType(document.fileName), text: decode(document.content, document.extractedContext),
    }));
    if (projectData.pdd) sources.push({ id: 'pdd-artifact', name: `${project.id}-pdd`, type: 'PDD', text: JSON.stringify(projectData.pdd) });
    const evaluated = criteria.map((criterion: any) => evaluate(criterion, sources));
    const status = evaluated.some(item => item.severity === 'mandatory' && item.status !== 'passed')
      ? 'NOT_READY'
      : evaluated.some(item => item.severity === 'recommended' && item.status !== 'passed') ? 'READY_WITH_RISKS' : 'READY';
    const overallScore = evaluated.length
      ? evaluated.reduce((sum, item) => sum + (item.status === 'passed' ? 100 : item.status === 'partial' ? 50 : 0), 0) / evaluated.length
      : 0;
    const hasOverride = await db.a2BOverride.count({ where: { projectId: project.id, isActive: true } }) > 0;
    const runId = randomUUID();
    const executedBy = String(req.body?.executedBy ?? 'System');
    const updatedData = appendAudit({
      ...projectData, currentStage: 'A2B Readiness Check', a2bStatus: status, a2bLastRunId: runId,
      sddEnabled: status === 'READY' || hasOverride,
    }, 'A2B Readiness Executed', `Result: ${status}; score: ${overallScore}`, executedBy, 'System');
    const run = await db.$transaction(async (tx: any) => {
      const created = await tx.a2BReadinessRun.create({
        data: { id: runId, projectId: project.id, pddId: projectData.pdd ? 'pdd-artifact' : null, status, overallScore, executedBy },
      });
      await tx.a2BReadinessResult.createMany({
        data: evaluated.map(item => ({ id: randomUUID(), readinessRunId: runId, criteriaId: item.criteriaId, ...item.result })),
      });
      await tx.opportunity.update({
        where: { id: project.id },
        data: { currentStage: 'A2B Readiness Check', a2bStatus: status, a2bLastRunId: runId, sddEnabled: updatedData.sddEnabled, data: JSON.stringify(updatedData) },
      });
      return created;
    });
    return res.json(run);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'A2B execution failed.' });
  }
});

router.get('/projects/:projectId/a2b/status', async (req, res) => {
  const project = await prisma.opportunity.findUnique({ where: { id: req.params.projectId } }) as any;
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const run = await db.a2BReadinessRun.findFirst({ where: { projectId: project.id }, orderBy: { executedAt: 'desc' } });
  const overridden = await db.a2BOverride.count({ where: { projectId: project.id, isActive: true } }) > 0;
  return res.json({ status: project.a2bStatus, overallScore: run?.overallScore ?? 0, lastRunId: project.a2bLastRunId, sddEnabled: project.sddEnabled, overridden });
});

router.get('/projects/:projectId/a2b/results', async (req, res) => {
  const run = await db.a2BReadinessRun.findFirst({ where: { projectId: req.params.projectId }, orderBy: { executedAt: 'desc' } });
  if (!run) return res.json({ run: null, results: [] });
  const rows = await db.a2BReadinessResult.findMany({ where: { readinessRunId: run.id }, include: { criterion: true } });
  return res.json({
    run,
    results: rows.map((row: any) => ({
      id: row.id, criterionId: row.criteriaId, criterionName: row.criterion.name,
      category: row.criterion.category, severity: row.criterion.severity,
      status: row.status, confidenceScore: row.confidenceScore, evidenceFound: row.evidenceFound,
      missingInformation: row.missingInformation, recommendation: row.recommendation,
      sourceDocumentId: row.sourceDocumentId, sourceDocumentName: row.sourceLocation, sourceLocation: row.sourceLocation,
    })),
  });
});

router.post('/projects/:projectId/a2b/override', async (req, res) => {
  const project = await prisma.opportunity.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const role = String(req.body?.role ?? '');
  const reason = String(req.body?.reason ?? '');
  if (!authorizedRoles.has(role)) return res.status(403).json({ error: 'This role is not authorized to override A2B.' });
  if (!reason.trim()) return res.status(400).json({ error: 'Override reason is required.' });
  const currentData = parseOpportunityData(project);
  const authorizedBy = String(req.body?.authorizedBy ?? 'Authorized User');
  const updatedData = appendAudit({ ...currentData, sddEnabled: true }, 'A2B Override', reason, authorizedBy, role);
  const entry = await db.$transaction(async (tx: any) => {
    const created = await tx.a2BOverride.create({
      data: { projectId: project.id, authorizedBy, role, reason },
    });
    await tx.opportunity.update({ where: { id: project.id }, data: { sddEnabled: true, data: JSON.stringify(updatedData) } });
    return created;
  });
  return res.json(entry);
});

function evaluate(criterion: any, sources: Array<{ id: string; name: string; type: string; text: string }>) {
  const types: string[] = safeArray(criterion.applicableDocumentTypes);
  const applicable = types.length ? sources.filter(source => types.some(type => type.toLowerCase() === source.type.toLowerCase())) : sources;
  const terms = String(criterion.expectedEvidence).split(/[\s,;/]+/).filter(term => term.length > 3);
  const candidates = applicable.map(source => ({ source, matches: terms.filter(term => source.text.toLowerCase().includes(term.toLowerCase())).length }));
  candidates.sort((left, right) => right.matches - left.matches);
  const best = candidates[0];
  const ratio = terms.length ? (best?.matches ?? 0) / terms.length : 0;
  const status = !applicable.length ? 'failed' : ratio >= 0.6 ? 'passed' : ratio > 0 ? 'partial' : 'failed';
  return {
    criteriaId: criterion.id, severity: criterion.severity,
    result: {
      status, confidenceScore: Math.round(ratio * 10000) / 100,
      evidenceFound: status === 'failed' ? '' : `Matched ${best.matches} of ${terms.length} expected evidence terms in ${best.source.name}.`,
      missingInformation: status === 'passed' ? '' : !applicable.length ? `No applicable document was found. Expected one of: ${types.join(', ')}.` : criterion.expectedEvidence,
      recommendation: status === 'passed' ? 'Evidence is sufficient.' : !applicable.length ? 'Upload an applicable document and run A2B again.' : `Add clear evidence for: ${criterion.expectedEvidence}.`,
      sourceDocumentId: best?.matches > 0 ? best.source.id : null,
      sourceLocation: best?.matches > 0 ? best.source.name : null,
    },
  };
}

function safeArray(value: string): string[] {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
}

function criterionDto(criterion: any) {
  return { ...criterion, applicableDocumentTypes: safeArray(criterion.applicableDocumentTypes) };
}

function inferType(fileName: string) {
  const name = fileName.toLowerCase();
  if (name.includes('pdd')) return 'PDD';
  if (name.includes('brd') || name.includes('business-requirement')) return 'BRD';
  if (name.includes('requirement') || name.includes('user-stor')) return 'requirements';
  if (name.includes('process') || name.includes('sop')) return 'process';
  return 'attachment';
}

function decode(content: string, extractedContext: string | null) {
  try { return `${Buffer.from(content, 'base64').toString('utf8')} ${extractedContext ?? ''}`; }
  catch { return `${content} ${extractedContext ?? ''}`; }
}

function appendAudit(data: Record<string, any>, action: string, details: string, performedBy: string, role: string) {
  return {
    ...data,
    auditTrail: [
      ...(Array.isArray(data.auditTrail) ? data.auditTrail : []),
      { id: randomUUID(), timestamp: new Date().toISOString(), action, performedBy, role, details, stage: data.currentStage ?? 'Submitted' },
    ],
  };
}

export default router;
