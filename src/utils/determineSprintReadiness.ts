import type { AutomationOpportunity, SprintReadiness, SprintGate } from '../models/types';

/**
 * Determine sprint readiness by evaluating gate conditions.
 * All gates must pass for "Sprint Ready" status.
 */
export function determineSprintReadiness(opp: AutomationOpportunity): SprintReadiness {
  const gates: SprintGate[] = [
    {
      name: 'Classification Complete',
      passed: opp.classification !== null,
      description: 'Automation type has been classified and accepted',
    },
    {
      name: 'L1 Qualification Passed',
      passed: opp.qualification?.status === 'Qualified',
      description: 'Opportunity passed L1 qualification checks',
    },
    {
      name: 'Opportunity Scored',
      passed: opp.score !== null && opp.score.totalScore > 0,
      description: 'Priority scoring has been completed',
    },
    {
      name: 'L2 Discovery Complete',
      passed: opp.discovery !== null && opp.discovery.asIsSteps.length > 0,
      description: 'Process discovery and as-is documentation completed',
    },
    {
      name: 'Solution Designed',
      passed: opp.solution !== null,
      description: 'Solution architecture and technology recommendations defined',
    },
    {
      name: 'ROI Approved',
      passed: opp.businessCase !== null && opp.businessCase.roiPercentage > 0,
      description: 'Business case and ROI analysis approved by stakeholders',
    },
    {
      name: 'Pod Allocated',
      passed: opp.podAllocation !== null,
      description: 'Delivery pod has been assigned with sufficient capacity',
    },
    {
      name: 'Compliance Cleared',
      passed: opp.complianceChecks.length > 0 && opp.complianceChecks.every(c => c.status === 'Passed' || c.status === 'Not Applicable'),
      description: 'All compliance and governance checks have passed',
    },
    {
      name: 'Backlog Items Created',
      passed: opp.backlogItems.length > 0,
      description: 'Sprint backlog items have been created in Jira',
    },
  ];

  const passedCount = gates.filter(g => g.passed).length;
  const readinessScore = Math.round((passedCount / gates.length) * 100);

  const blockers: string[] = gates
    .filter(g => !g.passed)
    .map(g => `${g.name}: ${g.description}`);

  let status: SprintReadiness['status'];
  if (passedCount === gates.length) {
    status = 'Sprint Ready';
  } else if (passedCount >= gates.length - 2) {
    status = 'Blocked';
  } else {
    status = 'Not Ready';
  }

  return {
    status,
    readinessScore,
    gates,
    blockers,
    targetSprintDate: getNextSprintDate(),
  };
}

function getNextSprintDate(): string {
  const now = new Date();
  // Next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
  return nextMonday.toISOString().split('T')[0];
}
