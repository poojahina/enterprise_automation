import type { ProcessCharacteristics, ClassificationResult, AutomationType } from '../models/types';

/**
 * Classify an automation opportunity into one of four types based on
 * process characteristics using rule-based logic.
 *
 * Classification hierarchy:
 * 1. Hyperautomation/Agentic — high autonomy, reasoning + multi-system + GenAI
 * 2. Intelligent Automation — document understanding, NLP, GenAI without multi-system
 * 3. RPA — rule-based, structured data, no reasoning
 * 4. Power Automate/Power Platform — workflow automation, API-driven, low complexity
 */
export function classifyAutomationType(chars: ProcessCharacteristics): ClassificationResult {
  const scores: Record<AutomationType, number> = {
    'Hyperautomation/Agentic Automation': 0,
    'RPA': 0,
    'Intelligent Automation': 0,
    'Power Automate/Power Platform': 0,
  };

  // ── Hyperautomation/Agentic scoring ────────────────────────
  if (chars.autonomyLevel >= 4) scores['Hyperautomation/Agentic Automation'] += 30;
  if (chars.autonomyLevel >= 3) scores['Hyperautomation/Agentic Automation'] += 10;
  if (chars.requiresReasoning) scores['Hyperautomation/Agentic Automation'] += 20;
  if (chars.requiresMultiSystemOrchestration) scores['Hyperautomation/Agentic Automation'] += 20;
  if (chars.usesGenAI) scores['Hyperautomation/Agentic Automation'] += 15;
  if (chars.dataType === 'Unstructured') scores['Hyperautomation/Agentic Automation'] += 5;
  if (chars.processComplexity === 'High') scores['Hyperautomation/Agentic Automation'] += 10;
  if (!chars.isRuleBased) scores['Hyperautomation/Agentic Automation'] += 5;

  // ── Intelligent Automation scoring ─────────────────────────
  if (chars.requiresDocumentUnderstanding) scores['Intelligent Automation'] += 30;
  if (chars.usesGenAI && !chars.requiresMultiSystemOrchestration) scores['Intelligent Automation'] += 25;
  if (chars.usesGenAI) scores['Intelligent Automation'] += 10;
  if (chars.dataType === 'Semi-Structured') scores['Intelligent Automation'] += 15;
  if (chars.dataType === 'Unstructured') scores['Intelligent Automation'] += 20;
  if (chars.requiresReasoning && !chars.requiresMultiSystemOrchestration) scores['Intelligent Automation'] += 15;
  if (chars.requiresHumanInTheLoop) scores['Intelligent Automation'] += 5;
  if (chars.processComplexity === 'Medium') scores['Intelligent Automation'] += 5;

  // ── RPA scoring ────────────────────────────────────────────
  if (chars.isRuleBased) scores['RPA'] += 30;
  if (chars.dataType === 'Structured') scores['RPA'] += 25;
  if (!chars.requiresReasoning) scores['RPA'] += 20;
  if (!chars.usesGenAI) scores['RPA'] += 10;
  if (!chars.requiresDocumentUnderstanding) scores['RPA'] += 5;
  if (chars.autonomyLevel <= 2) scores['RPA'] += 10;
  if (chars.processComplexity === 'Low') scores['RPA'] += 10;
  if (!chars.requiresMultiSystemOrchestration) scores['RPA'] += 5;

  // ── Power Platform scoring ─────────────────────────────────
  if (chars.isWorkflowAutomation) scores['Power Automate/Power Platform'] += 30;
  if (chars.hasAPIAvailability) scores['Power Automate/Power Platform'] += 20;
  if (chars.processComplexity === 'Low') scores['Power Automate/Power Platform'] += 20;
  if (chars.dataType === 'Structured') scores['Power Automate/Power Platform'] += 10;
  if (!chars.requiresReasoning) scores['Power Automate/Power Platform'] += 10;
  if (!chars.usesGenAI) scores['Power Automate/Power Platform'] += 5;
  if (chars.autonomyLevel <= 2) scores['Power Automate/Power Platform'] += 5;
  if (!chars.requiresDocumentUnderstanding) scores['Power Automate/Power Platform'] += 5;

  // ── Determine winner ──────────────────────────────────────
  const maxScore = Math.max(...Object.values(scores));
  const entries = Object.entries(scores) as [AutomationType, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const recommended = entries[0][0];
  const confidence = Math.min(100, Math.round((entries[0][1] / (maxScore + 20)) * 100));

  // Build reasoning
  const reasoning = buildReasoning(chars, recommended);
  const assumptions = buildAssumptions(chars);
  const alternatives = entries.slice(1).map(([type, score]) => ({
    type,
    score: Math.min(100, Math.round((score / (maxScore + 20)) * 100)),
    reason: getAlternativeReason(type, chars),
  }));

  // Normalize match scores to 0-100
  const matchScores = {} as Record<AutomationType, number>;
  for (const [type, score] of entries) {
    matchScores[type] = Math.min(100, Math.round((score / (maxScore + 20)) * 100));
  }

  return {
    recommendedType: recommended,
    confidenceScore: confidence,
    reasoning,
    assumptions,
    alternatives,
    matchScores,
  };
}

function buildReasoning(chars: ProcessCharacteristics, type: AutomationType): string {
  const reasons: string[] = [];

  switch (type) {
    case 'Hyperautomation/Agentic Automation':
      if (chars.autonomyLevel >= 4) reasons.push(`High autonomy level (${chars.autonomyLevel}/5) indicates agentic capabilities`);
      if (chars.requiresReasoning) reasons.push('Process requires complex reasoning and decision-making');
      if (chars.requiresMultiSystemOrchestration) reasons.push('Multi-system orchestration needed across enterprise landscape');
      if (chars.usesGenAI) reasons.push('GenAI capabilities required for intelligent processing');
      if (chars.processComplexity === 'High') reasons.push('High process complexity demands hyperautomation approach');
      break;
    case 'Intelligent Automation':
      if (chars.requiresDocumentUnderstanding) reasons.push('Document understanding/OCR capabilities are central to this process');
      if (chars.usesGenAI) reasons.push('GenAI enhances intelligent document and data processing');
      if (chars.dataType !== 'Structured') reasons.push(`${chars.dataType} data requires intelligent parsing`);
      if (chars.requiresReasoning) reasons.push('Cognitive reasoning needed for exception handling');
      break;
    case 'RPA':
      if (chars.isRuleBased) reasons.push('Highly rule-based process ideal for robotic process automation');
      if (chars.dataType === 'Structured') reasons.push('Structured data enables deterministic bot execution');
      if (!chars.requiresReasoning) reasons.push('No complex reasoning required — straightforward automation');
      if (chars.autonomyLevel <= 2) reasons.push('Low autonomy requirement suits attended/unattended RPA bots');
      break;
    case 'Power Automate/Power Platform':
      if (chars.isWorkflowAutomation) reasons.push('Workflow-centric process fits Power Automate cloud flows');
      if (chars.hasAPIAvailability) reasons.push('Existing API connectors enable rapid Power Platform integration');
      if (chars.processComplexity === 'Low') reasons.push('Low complexity suitable for citizen-developer Power Apps');
      break;
  }

  return reasons.join('. ') + '.';
}

function buildAssumptions(chars: ProcessCharacteristics): string[] {
  const assumptions: string[] = [];
  if (chars.hasAPIAvailability) assumptions.push('APIs are documented and accessible for integration');
  if (chars.requiresHumanInTheLoop) assumptions.push('Human review checkpoints will be available during execution');
  if (chars.requiresMultiSystemOrchestration) assumptions.push('Cross-system credentials and access policies are manageable');
  if (chars.usesGenAI) assumptions.push('Organization has approved GenAI usage for this process domain');
  if (chars.requiresDocumentUnderstanding) assumptions.push('Document templates are relatively standardized');
  return assumptions;
}

function getAlternativeReason(type: AutomationType, chars: ProcessCharacteristics): string {
  switch (type) {
    case 'Hyperautomation/Agentic Automation':
      return chars.requiresMultiSystemOrchestration
        ? 'Could leverage agentic orchestration if autonomy requirements increase'
        : 'May benefit from agentic approach as process matures';
    case 'Intelligent Automation':
      return chars.usesGenAI || chars.requiresDocumentUnderstanding
        ? 'AI/ML capabilities could enhance accuracy and throughput'
        : 'Intelligent features could handle edge cases and exceptions';
    case 'RPA':
      return chars.isRuleBased
        ? 'Rule-based components could be handled by traditional RPA bots'
        : 'Simpler sub-processes may be candidates for RPA';
    case 'Power Automate/Power Platform':
      return chars.isWorkflowAutomation
        ? 'Workflow portions could be rapidly built with Power Automate'
        : 'Low-code option viable for simpler workflow segments';
  }
}
