import type { AutomationOpportunity, OpportunityScore } from '../models/types';
import { calculateComplexity } from './calculateComplexity';

/**
 * AI-assisted opportunity scoring engine.
 * Weighted scoring across four dimensions:
 * - Business Impact (30%)
 * - Strategic Alignment (20%)
 * - Feasibility (25%)
 * - ROI Potential (25%)
 */
export function calculatePriorityScore(opp: AutomationOpportunity): OpportunityScore {
  const businessImpact = calculateBusinessImpact(opp);
  const strategicAlignment = calculateStrategicAlignment(opp);
  const feasibility = calculateFeasibility(opp);
  const roiPotential = calculateROIPotential(opp);

  const totalScore = Math.round(
    businessImpact * 0.30 +
    strategicAlignment * 0.20 +
    feasibility * 0.25 +
    roiPotential * 0.25
  );

  const priorityBand = totalScore >= 75 ? 'High' : totalScore >= 45 ? 'Medium' : 'Low';
  const complexity = calculateComplexity(opp);

  return {
    totalScore,
    priorityBand,
    complexity,
    dimensions: { businessImpact, strategicAlignment, feasibility, roiPotential },
    recommendedAutomationType: opp.classification?.recommendedType ?? 'RPA',
    ranking: 0, // set externally when comparing multiple opportunities
  };
}

function calculateBusinessImpact(opp: AutomationOpportunity): number {
  let score = 0;
  // Time savings contribution (max 30)
  score += Math.min(30, (opp.impact.timeSavingsHoursPerMonth / 100) * 30);
  // Cost savings contribution (max 25)
  score += Math.min(25, (opp.impact.costSavingsPerMonth / 10000) * 25);
  // Volume impact (max 20)
  score += Math.min(20, (opp.metrics.volumePerMonth / 5000) * 20);
  // Users impacted (max 15)
  score += Math.min(15, (opp.metrics.usersImpacted / 50) * 15);
  // Error rate reduction potential (max 10)
  score += Math.min(10, (opp.metrics.errorRatePercent / 20) * 10);
  return Math.min(100, Math.round(score));
}

function calculateStrategicAlignment(opp: AutomationOpportunity): number {
  let score = 0;
  const alignment = opp.impact.strategicAlignment;
  if (alignment === 'High') score += 40;
  else if (alignment === 'Medium') score += 25;
  else score += 10;

  const priority = opp.priority.businessPriority;
  if (priority === 'Critical') score += 35;
  else if (priority === 'High') score += 25;
  else if (priority === 'Medium') score += 15;
  else score += 5;

  if (opp.priority.regulatoryRequirement) score += 15;
  if (opp.priority.complianceImpact === 'High') score += 10;
  return Math.min(100, score);
}

function calculateFeasibility(opp: AutomationOpportunity): number {
  let score = 100;
  // Deductions for complexity factors
  if (opp.processCharacteristics.dataType === 'Unstructured') score -= 20;
  else if (opp.processCharacteristics.dataType === 'Semi-Structured') score -= 10;
  if (opp.processCharacteristics.processComplexity === 'High') score -= 25;
  else if (opp.processCharacteristics.processComplexity === 'Medium') score -= 10;
  if (opp.processCharacteristics.requiresMultiSystemOrchestration) score -= 15;
  if (opp.technical.applications.length > 5) score -= 10;
  if (!opp.processCharacteristics.hasAPIAvailability) score -= 15;
  if (opp.processCharacteristics.requiresHumanInTheLoop) score -= 5;
  return Math.max(0, score);
}

function calculateROIPotential(opp: AutomationOpportunity): number {
  const annualSavings = (opp.impact.costSavingsPerMonth + opp.impact.timeSavingsHoursPerMonth * 50) * 12;
  // Rough implementation cost estimate based on complexity
  const complexityMultiplier =
    opp.processCharacteristics.processComplexity === 'High' ? 3 :
    opp.processCharacteristics.processComplexity === 'Medium' ? 2 : 1;
  const estimatedCost = complexityMultiplier * 50000;
  const roi = ((annualSavings - estimatedCost) / estimatedCost) * 100;
  // Normalize to 0-100 score
  return Math.min(100, Math.max(0, Math.round(roi / 3)));
}
