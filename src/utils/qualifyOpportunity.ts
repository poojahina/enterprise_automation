import type { AutomationOpportunity, QualificationResult, QualificationCheck } from '../models/types';

/**
 * L1 Qualification Engine — validates that an opportunity meets minimum
 * thresholds for volume, impact, data availability, and completeness.
 */
export function qualifyOpportunity(opp: AutomationOpportunity): QualificationResult {
  const checks: QualificationCheck[] = [];
  const missingInfo: string[] = [];

  // 1. Process Volume Check
  checks.push({
    name: 'Minimum Volume Threshold',
    passed: opp.metrics.volumePerMonth >= 50,
    details: opp.metrics.volumePerMonth >= 50
      ? `Volume of ${opp.metrics.volumePerMonth}/month exceeds minimum threshold (50)`
      : `Volume of ${opp.metrics.volumePerMonth}/month is below minimum threshold (50)`,
    weight: 20,
  });

  // 2. Manual Effort Justification
  checks.push({
    name: 'Manual Effort Justification',
    passed: opp.metrics.manualEffortHours >= 10,
    details: opp.metrics.manualEffortHours >= 10
      ? `${opp.metrics.manualEffortHours} hours/month of manual effort justifies automation`
      : `${opp.metrics.manualEffortHours} hours/month may not justify automation investment`,
    weight: 20,
  });

  // 3. Business Impact
  checks.push({
    name: 'Business Impact Assessment',
    passed: opp.impact.timeSavingsHoursPerMonth >= 5 || opp.impact.costSavingsPerMonth >= 500,
    details: `Time savings: ${opp.impact.timeSavingsHoursPerMonth}h/month, Cost savings: $${opp.impact.costSavingsPerMonth.toLocaleString()}/month`,
    weight: 15,
  });

  // 4. Data Availability
  const hasDataSources = opp.technical.dataSources.length > 0;
  checks.push({
    name: 'Data Source Availability',
    passed: hasDataSources,
    details: hasDataSources
      ? `${opp.technical.dataSources.length} data source(s) identified`
      : 'No data sources specified — unable to assess integration feasibility',
    weight: 15,
  });
  if (!hasDataSources) missingInfo.push('Data sources need to be identified');

  // 5. Application Landscape
  const hasApps = opp.technical.applications.length > 0;
  checks.push({
    name: 'Application Landscape Defined',
    passed: hasApps,
    details: hasApps
      ? `${opp.technical.applications.length} application(s) in scope: ${opp.technical.applications.join(', ')}`
      : 'No applications identified for automation scope',
    weight: 10,
  });
  if (!hasApps) missingInfo.push('Application landscape needs documentation');

  // 6. Process Owner Identified
  const hasOwner = opp.processOwner.trim().length > 0;
  checks.push({
    name: 'Process Owner Identified',
    passed: hasOwner,
    details: hasOwner ? `Process owner: ${opp.processOwner}` : 'No process owner assigned',
    weight: 10,
  });
  if (!hasOwner) missingInfo.push('Process owner assignment required');

  // 7. Compliance Assessment
  checks.push({
    name: 'Compliance Impact Evaluated',
    passed: opp.priority.complianceImpact !== 'High' || opp.priority.regulatoryRequirement,
    details: opp.priority.complianceImpact === 'High'
      ? 'High compliance impact — regulatory review required before proceeding'
      : `Compliance impact: ${opp.priority.complianceImpact}`,
    weight: 10,
  });

  // Calculate overall score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks.filter(c => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const overallScore = Math.round((earnedWeight / totalWeight) * 100);

  // Determine status
  const failedCount = checks.filter(c => !c.passed).length;
  let status: QualificationResult['status'];
  let recommendation: string;

  if (overallScore >= 70 && failedCount <= 1) {
    status = 'Qualified';
    recommendation = 'Opportunity meets qualification criteria. Proceed to scoring and discovery.';
  } else if (overallScore >= 40 || missingInfo.length > 0) {
    status = 'Needs More Information';
    recommendation = `Additional information required: ${missingInfo.join('; ')}. Address gaps before re-qualification.`;
  } else {
    status = 'Rejected';
    recommendation = 'Opportunity does not meet minimum qualification thresholds. Consider revisiting after process maturity improves.';
  }

  return { status, overallScore, checks, missingInfo, recommendation };
}
