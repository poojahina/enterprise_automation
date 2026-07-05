import type { ProcessCharacteristics, ClassificationResult, SupportedAutomationType } from '../models/types';

export function classifyAutomationType(chars: ProcessCharacteristics): ClassificationResult {
  const scores: Record<SupportedAutomationType, number> = {
    'Power Platform': 0,
    'Automation Anywhere': 0,
    'Azure AI': 0,
  };

  if (chars.isWorkflowAutomation) scores['Power Platform'] += 30;
  if (chars.hasAPIAvailability) scores['Power Platform'] += 25;
  if (chars.processComplexity !== 'High') scores['Power Platform'] += 15;
  if (chars.dataType === 'Structured') scores['Power Platform'] += 10;
  if (chars.requiresHumanInTheLoop) scores['Power Platform'] += 10;
  if (!chars.usesGenAI) scores['Power Platform'] += 5;

  if (chars.isRuleBased) scores['Automation Anywhere'] += 30;
  if (chars.dataType === 'Structured') scores['Automation Anywhere'] += 20;
  if (!chars.hasAPIAvailability) scores['Automation Anywhere'] += 25;
  if (!chars.requiresReasoning) scores['Automation Anywhere'] += 15;
  if (chars.requiresMultiSystemOrchestration) scores['Automation Anywhere'] += 10;
  if (chars.autonomyLevel <= 3) scores['Automation Anywhere'] += 5;

  if (chars.usesGenAI) scores['Azure AI'] += 30;
  if (chars.requiresReasoning) scores['Azure AI'] += 25;
  if (chars.requiresDocumentUnderstanding) scores['Azure AI'] += 25;
  if (chars.dataType !== 'Structured') scores['Azure AI'] += 15;
  if (chars.autonomyLevel >= 4) scores['Azure AI'] += 10;
  if (chars.processComplexity === 'High') scores['Azure AI'] += 10;

  const entries = (Object.entries(scores) as [SupportedAutomationType, number][]).sort((a, b) => b[1] - a[1]);
  const maxScore = Math.max(entries[0][1], 1);
  const normalize = (score: number) => Math.min(100, Math.round((score / (maxScore + 15)) * 100));
  const recommended = entries[0][0];
  const matchScores = Object.fromEntries(entries.map(([type, score]) => [type, normalize(score)])) as ClassificationResult['matchScores'];

  return {
    recommendedType: recommended,
    confidenceScore: matchScores[recommended],
    reasoning: buildReasoning(chars, recommended),
    assumptions: buildAssumptions(chars),
    alternatives: entries.slice(1).map(([type, score]) => ({ type, score: normalize(score), reason: alternativeReason(type) })),
    matchScores,
  };
}

export function normalizeAutomationType(value?: string | null): SupportedAutomationType {
  if (value === 'Power Platform' || value === 'Power Automate/Power Platform') return 'Power Platform';
  if (value === 'Automation Anywhere' || value === 'RPA') return 'Automation Anywhere';
  return 'Azure AI';
}

function buildReasoning(chars: ProcessCharacteristics, type: SupportedAutomationType): string {
  if (type === 'Power Platform')
    return `The process is workflow-oriented${chars.hasAPIAvailability ? ' with connector/API-ready systems' : ''}, making Power Apps, Power Automate, Dataverse, and Power BI the strongest delivery fit.`;
  if (type === 'Automation Anywhere')
    return `The process is deterministic and rule-based${!chars.hasAPIAvailability ? ' with UI-level integration needs' : ''}, making attended or unattended Automation Anywhere bots the strongest fit.`;
  return `The process requires ${chars.requiresDocumentUnderstanding ? 'document understanding, ' : ''}${chars.requiresReasoning ? 'reasoning, ' : ''}or generative AI capabilities, making Azure AI the strongest fit.`;
}

function buildAssumptions(chars: ProcessCharacteristics): string[] {
  const assumptions: string[] = [];
  if (chars.hasAPIAvailability) assumptions.push('Required APIs and connectors are approved and accessible.');
  if (chars.requiresHumanInTheLoop) assumptions.push('Named reviewers and approval SLAs will be available.');
  if (chars.usesGenAI) assumptions.push('Azure AI usage and responsible-AI controls are approved.');
  if (chars.requiresDocumentUnderstanding) assumptions.push('Representative documents are available for extraction testing.');
  return assumptions;
}

function alternativeReason(type: SupportedAutomationType): string {
  if (type === 'Power Platform') return 'Suitable where low-code apps, approvals, connectors, and reporting dominate.';
  if (type === 'Automation Anywhere') return 'Suitable where deterministic UI automation or legacy applications dominate.';
  return 'Suitable where document extraction, language understanding, reasoning, or agents dominate.';
}
