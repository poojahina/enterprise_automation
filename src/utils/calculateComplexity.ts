import type { AutomationOpportunity, OpportunityScore } from '../models/types';

/**
 * Calculate complexity T-shirt size based on process characteristics.
 * Factors: number of systems, data type, process complexity, exceptions, integrations.
 */
export function calculateComplexity(opp: AutomationOpportunity): OpportunityScore['complexity'] {
  let score = 0;

  // Systems count
  const systemCount = opp.technical.applications.length;
  if (systemCount >= 6) score += 4;
  else if (systemCount >= 4) score += 3;
  else if (systemCount >= 2) score += 2;
  else score += 1;

  // Data type
  if (opp.processCharacteristics.dataType === 'Unstructured') score += 4;
  else if (opp.processCharacteristics.dataType === 'Semi-Structured') score += 2;
  else score += 1;

  // Process complexity
  if (opp.processCharacteristics.processComplexity === 'High') score += 4;
  else if (opp.processCharacteristics.processComplexity === 'Medium') score += 2;
  else score += 1;

  // Multi-system orchestration
  if (opp.processCharacteristics.requiresMultiSystemOrchestration) score += 3;

  // Reasoning requirement
  if (opp.processCharacteristics.requiresReasoning) score += 2;

  // GenAI
  if (opp.processCharacteristics.usesGenAI) score += 2;

  // Human-in-the-loop
  if (opp.processCharacteristics.requiresHumanInTheLoop) score += 1;

  // Autonomy
  score += Math.max(0, opp.processCharacteristics.autonomyLevel - 2);

  // Map to T-shirt size
  if (score <= 5) return 'XS';
  if (score <= 9) return 'S';
  if (score <= 13) return 'M';
  if (score <= 17) return 'L';
  return 'XL';
}
