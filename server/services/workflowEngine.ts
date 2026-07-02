import { randomUUID } from 'node:crypto';

type OpportunityRecord = Record<string, any>;

const pods = [
  {
    podName: 'Agentic AI Squad',
    podLead: 'Priya Sharma',
    teamSize: 6,
    skills: ['LangChain', 'Multi-Agent Systems', 'GenAI', 'Python', 'Azure OpenAI'],
    currentCapacity: 40,
    assignedOpportunities: 2,
    specialization: 'Hyperautomation/Agentic Automation',
    deliveryRisk: 'Medium',
    notes: 'Specializes in agentic orchestration and multi-system AI workflows',
  },
  {
    podName: 'RPA Center of Excellence',
    podLead: 'Michael Chen',
    teamSize: 8,
    skills: ['UiPath', 'Automation Anywhere', 'Blue Prism', '.NET', 'SQL'],
    currentCapacity: 60,
    assignedOpportunities: 3,
    specialization: 'RPA',
    deliveryRisk: 'Low',
    notes: 'Mature team with 50+ bot deliveries. Strong governance framework.',
  },
  {
    podName: 'Intelligent Automation Lab',
    podLead: 'Sarah Rodriguez',
    teamSize: 5,
    skills: ['Document AI', 'NLP', 'Computer Vision', 'Python', 'Azure Cognitive Services'],
    currentCapacity: 55,
    assignedOpportunities: 2,
    specialization: 'Intelligent Automation',
    deliveryRisk: 'Medium',
    notes: 'Expert in document processing, OCR, and AI/ML pipelines',
  },
  {
    podName: 'Power Platform Guild',
    podLead: 'James Wilson',
    teamSize: 4,
    skills: ['Power Automate', 'Power Apps', 'Power BI', 'SharePoint', 'Dataverse'],
    currentCapacity: 70,
    assignedOpportunities: 4,
    specialization: 'Power Automate/Power Platform',
    deliveryRisk: 'Low',
    notes: 'Citizen developer enablement team. Rapid delivery of workflow automation.',
  },
];

export function runWorkflowAction(opportunity: OpportunityRecord, action: string, input: OpportunityRecord = {}) {
  const updated = { ...opportunity };

  switch (action) {
    case 'accept-classification':
      updated.qualification = qualifyOpportunity(updated);
      updated.currentStage = 'Classified';
      appendAudit(updated, 'Classification Accepted', 'Classification was accepted and L1 qualification was generated.');
      return updated;

    case 'override-classification':
      updated.classification = {
        ...(updated.classification ?? {}),
        recommendedType: input.recommendedType ?? updated.classification?.recommendedType ?? 'RPA',
        confidenceScore: Number(input.confidenceScore ?? updated.classification?.confidenceScore ?? 75),
        reasoning: input.reasoning ?? 'Classification manually overridden by an analyst.',
      };
      updated.qualification = qualifyOpportunity(updated);
      updated.currentStage = 'Classified';
      appendAudit(updated, 'Classification Overridden', `Classification changed to ${updated.classification.recommendedType}.`);
      return updated;

    case 'approve-qualification':
      updated.qualification = {
        ...(updated.qualification ?? qualifyOpportunity(updated)),
        status: 'Qualified',
        recommendation: 'Opportunity approved for scoring and discovery.',
      };
      updated.score = calculatePriorityScore(updated);
      updated.currentStage = 'Scored';
      appendAudit(updated, 'Qualification Approved', 'Opportunity qualified and priority score generated.');
      return updated;

    case 'request-more-info':
      updated.qualification = {
        ...(updated.qualification ?? qualifyOpportunity(updated)),
        status: 'Needs More Information',
        recommendation: input.reason ?? 'Additional process, application, and data source details are required.',
      };
      updated.currentStage = 'Classified';
      appendAudit(updated, 'More Information Requested', updated.qualification.recommendation);
      return updated;

    case 'reject-qualification':
      updated.qualification = {
        ...(updated.qualification ?? qualifyOpportunity(updated)),
        status: 'Rejected',
        recommendation: input.reason ?? 'Opportunity rejected during L1 qualification.',
      };
      updated.status = 'Rejected';
      appendAudit(updated, 'Qualification Rejected', updated.qualification.recommendation);
      return updated;

    case 'generate-score':
      updated.score = calculatePriorityScore(updated);
      updated.currentStage = 'Scored';
      appendAudit(updated, 'Scoring Completed', `Score generated: ${updated.score.totalScore}.`);
      return updated;

    case 'apply-discovery':
      updated.discovery = input.discovery ?? generateDiscovery(updated, input.aiOutput);
      updated.currentStage = 'Discovery';
      appendAudit(updated, 'Discovery Applied', 'Discovery workspace was generated from context.');
      return updated;

    case 'apply-prd':
      updated.prd = input.prd ?? generatePrd(updated, input.aiOutput);
      updated.currentStage = 'PDD Creation';
      appendAudit(updated, 'PRD Created', 'Product requirements document was generated.');
      return updated;

    case 'apply-pdd':
      updated.pdd = input.pdd ?? generatePdd(updated);
      updated.currentStage = 'PDD Creation';
      appendAudit(updated, 'PDD Created', 'Process definition document was generated from discovery context.');
      return updated;

    case 'generate-solution':
      updated.solution = input.solution ?? generateSolution(updated);
      updated.currentStage = 'SDD Creation';
      appendAudit(updated, 'SDD Created', 'Solution design document was generated.');
      return updated;

    case 'approve-roi':
      updated.businessCase = calculateRoi({
        implementationCost: Number(input.implementationCost ?? updated.businessCase?.implementationCost ?? 100000),
        annualSavings: Number(input.annualSavings ?? updated.businessCase?.annualSavings ?? estimateAnnualSavings(updated)),
        annualSupportCost: Number(input.annualSupportCost ?? updated.businessCase?.annualSupportCost ?? 20000),
        timelineWeeks: Number(input.timelineWeeks ?? updated.businessCase?.timelineWeeks ?? 12),
        effortStoryPoints: Number(input.effortStoryPoints ?? updated.businessCase?.effortStoryPoints ?? 80),
        fteReduction: Number(input.fteReduction ?? updated.businessCase?.fteReduction ?? 2),
      });
      updated.currentStage = 'ROI Approved';
      appendAudit(updated, 'ROI Approved', `Business case approved with ROI ${updated.businessCase.roiPercentage}%.`);
      return updated;

    case 'prioritize':
      updated.currentStage = 'Prioritized';
      appendAudit(updated, 'Opportunity Prioritized', 'Opportunity was added to the prioritized delivery board.');
      return updated;

    case 'allocate-pod':
      updated.podAllocation = input.podAllocation ?? recommendPod(updated);
      updated.currentStage = 'Pod Allocated';
      appendAudit(updated, 'Pod Allocated', `${updated.podAllocation.podName} assigned.`);
      return updated;

    case 'generate-backlog':
      updated.backlogItems = input.backlogItems ?? generateBacklog(updated);
      appendAudit(updated, 'Backlog Generated', `${updated.backlogItems.length} backlog items generated.`);
      return updated;

    case 'assess-sprint-readiness':
      if (!updated.backlogItems?.length) updated.backlogItems = generateBacklog(updated);
      if (!updated.complianceChecks?.length) updated.complianceChecks = generateComplianceChecks();
      updated.sprintReadiness = determineSprintReadiness(updated);
      if (updated.sprintReadiness.status === 'Sprint Ready') updated.currentStage = 'Sprint Ready';
      appendAudit(updated, 'Sprint Readiness Assessed', `Readiness score: ${updated.sprintReadiness.readinessScore}.`);
      return updated;

    default:
      throw new Error(`Unsupported workflow action: ${action}`);
  }
}

export function generateDocument(opportunity: OpportunityRecord, docType: string) {
  const sections = buildDocumentSections(opportunity, docType);
  return sections
    .map((section) => [
      section.title,
      '-'.repeat(section.title.length),
      ...section.lines,
    ].join('\n'))
    .join('\n\n');
}

function buildDocumentSections(opportunity: OpportunityRecord, docType: string) {
  const prd = opportunity.prd ?? generatePrd(opportunity);
  const solution = opportunity.solution ?? generateSolution(opportunity);
  const businessCase = opportunity.businessCase ?? calculateRoi({
    implementationCost: estimateImplementationCost(opportunity),
    annualSavings: estimateAnnualSavings(opportunity),
    annualSupportCost: 20000,
    timelineWeeks: 12,
    effortStoryPoints: 80,
    fteReduction: Math.max(1, Math.round((opportunity.impact?.timeSavingsHoursPerMonth ?? 40) / 160)),
  });
  const backlogItems = opportunity.backlogItems?.length ? opportunity.backlogItems : generateBacklog(opportunity);
  const discovery = opportunity.discovery ?? generateDiscovery(opportunity);
  const score = opportunity.score ?? calculatePriorityScore(opportunity);

  const header = {
    title: `${titleForDoc(docType)} - ${opportunity.processName}`,
    lines: [
      `Opportunity ID: ${opportunity.id}`,
      `Current Stage: ${opportunity.currentStage}`,
      `Business Unit: ${opportunity.businessUnit ?? 'N/A'}`,
      `Process Owner: ${opportunity.processOwner ?? 'N/A'}`,
      `Automation Type: ${score.recommendedAutomationType}`,
      `Priority: ${score.priorityBand} | Complexity: ${score.complexity} | Score: ${score.totalScore}/100`,
      `Generated At: ${new Date().toISOString()}`,
    ],
  };

  if (docType === 'prd') {
    return [
      header,
      { title: '1. Executive Summary', lines: [prd.executiveSummary] },
      { title: '2. Personas and Stakeholders', lines: prd.userPersonas },
      { title: '3. Functional Requirements', lines: prd.functionalRequirements.map((item: string, index: number) => `FR-${index + 1}: ${item}`) },
      { title: '4. Non-Functional Requirements', lines: prd.nonFunctionalRequirements.map((item: string, index: number) => `NFR-${index + 1}: ${item}`) },
      { title: '5. Acceptance Criteria', lines: prd.acceptanceCriteria.map((item: string, index: number) => `AC-${index + 1}: ${item}`) },
      { title: '6. Out of Scope', lines: prd.outOfScope },
      { title: '7. Dependencies', lines: prd.dependencies },
      { title: '8. Discovery Traceability', lines: [
        `As-is steps: ${discovery.asIsSteps.join(' -> ')}`,
        `Business rules: ${discovery.businessRules.join('; ')}`,
        `Exceptions: ${discovery.exceptions.join('; ')}`,
        `Systems: ${discovery.systems.join(', ')}`,
      ] },
    ];
  }

  if (docType === 'pdd') {
    const pdd = opportunity.pdd ?? generatePdd(opportunity);
    return [
      header,
      { title: '1. Process Overview', lines: pdd.processOverview },
      { title: '2. Current-State Process (As-Is)', lines: pdd.currentStateSteps.map((item: string, index: number) => `Step ${index + 1}: ${item}`) },
      { title: '3. Systems and Applications', lines: pdd.systems },
      { title: '4. Inputs and Outputs', lines: pdd.inputsAndOutputs },
      { title: '5. Business Rules', lines: pdd.businessRules.map((item: string, index: number) => `BR-${index + 1}: ${item}`) },
      { title: '6. Exceptions', lines: pdd.exceptions },
      { title: '7. Human Decisions and Approvals', lines: pdd.humanApprovals },
      { title: '8. Pain Points and Baseline', lines: pdd.painPointsAndBaseline },
      { title: '9. Target Process (To-Be)', lines: pdd.targetProcess },
      { title: '10. Controls, SLA, and Compliance', lines: pdd.controls },
      { title: '11. Assumptions and Open Items', lines: pdd.openItems },
    ];
  }

  if (docType === 'business-case') {
    return [
      header,
      { title: '1. Executive Summary', lines: [
        `${opportunity.processName} targets measurable automation value for ${opportunity.businessUnit ?? 'the business unit'} by reducing manual effort, improving quality, and increasing control over the process.`,
        `Business priority is ${opportunity.priority?.businessPriority ?? 'Medium'} with target timeline ${opportunity.priority?.targetTimeline ?? 'TBD'}.`,
      ] },
      { title: '2. Baseline and Impact', lines: [
        `Monthly volume: ${(opportunity.metrics?.volumePerMonth ?? 0).toLocaleString()} transactions`,
        `Manual effort: ${(opportunity.metrics?.manualEffortHours ?? 0).toLocaleString()} hours/month`,
        `Current error rate: ${opportunity.metrics?.errorRatePercent ?? 0}%`,
        `Users impacted: ${(opportunity.metrics?.usersImpacted ?? 0).toLocaleString()}`,
        `Pain points: ${opportunity.impact?.painPoints ?? 'To be confirmed'}`,
      ] },
      { title: '3. Financial Analysis', lines: [
        `Implementation cost: $${businessCase.implementationCost.toLocaleString()}`,
        `Annual savings: $${businessCase.annualSavings.toLocaleString()}`,
        `Annual support cost: $${businessCase.annualSupportCost.toLocaleString()}`,
        `ROI: ${businessCase.roiPercentage}%`,
        `NPV over 3 years: $${businessCase.npv.toLocaleString()}`,
        `Payback period: ${businessCase.paybackPeriodMonths} months`,
        `Break-even: ${businessCase.breakEvenMonths} months`,
        `FTE reduction: ${businessCase.fteReduction}`,
      ] },
      { title: '4. Benefits', lines: [
        `${opportunity.impact?.timeSavingsHoursPerMonth ?? 0} hours/month target time savings`,
        `$${(opportunity.impact?.costSavingsPerMonth ?? 0).toLocaleString()}/month target cost savings`,
        `Quality improvement: ${opportunity.impact?.qualityImprovement ?? 'To be measured during UAT and hypercare'}`,
        `Risk reduction: ${opportunity.impact?.riskReduction ?? 'Improved control, auditability, and exception visibility'}`,
      ] },
      { title: '5. Delivery Assumptions and Risks', lines: [
        `Timeline: ${businessCase.timelineWeeks} weeks`,
        `Effort: ${businessCase.effortStoryPoints} story points`,
        `Dependencies: ${prd.dependencies.join('; ')}`,
        `Key risks: source system access, data quality, business rule sign-off, exception ownership, and support model readiness.`,
      ] },
    ];
  }

  if (docType === 'solution-design') {
    return [
      header,
      { title: '1. Solution Overview', lines: [solution.toBeSummary] },
      { title: '2. Recommended Technology Stack', lines: [solution.recommendedTechnology] },
      { title: '3. Architecture', lines: [solution.architectureSummary] },
      { title: '4. Components', lines: solution.components },
      { title: '5. Integrations', lines: solution.integrations },
      { title: '6. Human-in-the-Loop Design', lines: [solution.humanInLoopDesign] },
      { title: '7. Security and Governance', lines: [solution.securityConsiderations] },
      { title: '8. Monitoring and Operations', lines: [solution.monitoringStrategy] },
      { title: '9. Scalability and Resilience', lines: [solution.scalabilityNotes] },
      { title: '10. Estimated Delivery Effort', lines: [solution.estimatedEffort] },
    ];
  }

  if (docType === 'sprint-backlog') {
    return [
      header,
      { title: '1. Backlog Summary', lines: [
        `Backlog item count: ${backlogItems.length}`,
        `Total story points: ${backlogItems.reduce((sum: number, item: any) => sum + Number(item.storyPoints ?? 0), 0)}`,
        `Primary delivery type: ${score.recommendedAutomationType}`,
        `Priority band: ${score.priorityBand}`,
      ] },
      { title: '2. Sprint Backlog Items', lines: backlogItems.map((item: any) => `${item.jiraKey} | ${item.type} | ${item.priority} | ${item.storyPoints} SP | ${item.assignee} | ${item.sprint} | ${item.title} - ${item.description}`) },
      { title: '3. Definition of Ready', lines: [
        'PRD acceptance criteria reviewed and linked to backlog items.',
        'Source and target system access confirmed.',
        'Security, audit, and support requirements understood.',
        'Exception owners and UAT reviewers identified.',
      ] },
      { title: '4. Definition of Done', lines: [
        'Automation path tested with happy path, exception path, retry, and rollback scenarios.',
        'Audit trail and dashboards verified.',
        'Process owner signs off on UAT results.',
        'Runbook, support handoff, and hypercare plan completed.',
      ] },
    ];
  }

  return [header, { title: 'Document Content', lines: ['Unsupported document type.'] }];
}

function appendAudit(opportunity: OpportunityRecord, action: string, details: string) {
  opportunity.auditTrail = [
    ...(Array.isArray(opportunity.auditTrail) ? opportunity.auditTrail : []),
    {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      performedBy: 'System',
      role: 'Automation COE Analyst',
      details,
      stage: opportunity.currentStage ?? 'Submitted',
    },
  ];
}

function qualifyOpportunity(opp: OpportunityRecord) {
  const checks = [];
  const missingInfo = [];
  const metrics = opp.metrics ?? {};
  const impact = opp.impact ?? {};
  const technical = opp.technical ?? {};
  const priority = opp.priority ?? {};

  checks.push({ name: 'Minimum Volume Threshold', passed: (metrics.volumePerMonth ?? 0) >= 50, details: `Volume: ${metrics.volumePerMonth ?? 0}/month`, weight: 20 });
  checks.push({ name: 'Manual Effort Justification', passed: (metrics.manualEffortHours ?? 0) >= 10, details: `Manual effort: ${metrics.manualEffortHours ?? 0} hours/month`, weight: 20 });
  checks.push({ name: 'Business Impact Assessment', passed: (impact.timeSavingsHoursPerMonth ?? 0) >= 5 || (impact.costSavingsPerMonth ?? 0) >= 500, details: `Savings: ${impact.timeSavingsHoursPerMonth ?? 0}h and $${impact.costSavingsPerMonth ?? 0}/month`, weight: 15 });

  const hasDataSources = (technical.dataSources ?? []).length > 0;
  checks.push({ name: 'Data Source Availability', passed: hasDataSources, details: hasDataSources ? `${technical.dataSources.length} data source(s) identified` : 'No data sources specified', weight: 15 });
  if (!hasDataSources) missingInfo.push('Data sources need to be identified');

  const hasApps = (technical.applications ?? []).length > 0;
  checks.push({ name: 'Application Landscape Defined', passed: hasApps, details: hasApps ? `${technical.applications.length} application(s) in scope` : 'No applications identified', weight: 10 });
  if (!hasApps) missingInfo.push('Application landscape needs documentation');

  const hasOwner = String(opp.processOwner ?? '').trim().length > 0;
  checks.push({ name: 'Process Owner Identified', passed: hasOwner, details: hasOwner ? `Process owner: ${opp.processOwner}` : 'No process owner assigned', weight: 10 });
  if (!hasOwner) missingInfo.push('Process owner assignment required');

  checks.push({ name: 'Compliance Impact Evaluated', passed: priority.complianceImpact !== 'High' || priority.regulatoryRequirement === true, details: `Compliance impact: ${priority.complianceImpact ?? 'Low'}`, weight: 10 });

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earnedWeight = checks.filter(check => check.passed).reduce((sum, check) => sum + check.weight, 0);
  const overallScore = Math.round((earnedWeight / totalWeight) * 100);
  const failedCount = checks.filter(check => !check.passed).length;
  const status = overallScore >= 70 && failedCount <= 1 ? 'Qualified' : overallScore >= 40 || missingInfo.length > 0 ? 'Needs More Information' : 'Rejected';

  return {
    status,
    overallScore,
    checks,
    missingInfo,
    recommendation: status === 'Qualified'
      ? 'Opportunity meets qualification criteria. Proceed to scoring and discovery.'
      : status === 'Needs More Information'
        ? `Additional information required: ${missingInfo.join('; ')}.`
        : 'Opportunity does not meet minimum qualification thresholds.',
  };
}

function calculatePriorityScore(opp: OpportunityRecord) {
  const impact = opp.impact ?? {};
  const metrics = opp.metrics ?? {};
  const priority = opp.priority ?? {};
  const characteristics = opp.processCharacteristics ?? {};
  const technical = opp.technical ?? {};
  const businessImpact = Math.min(100, Math.round(
    Math.min(30, ((impact.timeSavingsHoursPerMonth ?? 0) / 100) * 30) +
    Math.min(25, ((impact.costSavingsPerMonth ?? 0) / 10000) * 25) +
    Math.min(20, ((metrics.volumePerMonth ?? 0) / 5000) * 20) +
    Math.min(15, ((metrics.usersImpacted ?? 0) / 50) * 15) +
    Math.min(10, ((metrics.errorRatePercent ?? 0) / 20) * 10)
  ));
  const strategicAlignment =
    (impact.strategicAlignment === 'High' ? 40 : impact.strategicAlignment === 'Medium' ? 25 : 10) +
    (priority.businessPriority === 'Critical' ? 35 : priority.businessPriority === 'High' ? 25 : priority.businessPriority === 'Medium' ? 15 : 5) +
    (priority.regulatoryRequirement ? 15 : 0) +
    (priority.complianceImpact === 'High' ? 10 : 0);
  let feasibility = 100;
  if (characteristics.dataType === 'Unstructured') feasibility -= 20;
  else if (characteristics.dataType === 'Semi-Structured') feasibility -= 10;
  if (characteristics.processComplexity === 'High') feasibility -= 25;
  else if (characteristics.processComplexity === 'Medium') feasibility -= 10;
  if (characteristics.requiresMultiSystemOrchestration) feasibility -= 15;
  if ((technical.applications ?? []).length > 5) feasibility -= 10;
  if (!characteristics.hasAPIAvailability) feasibility -= 15;
  if (characteristics.requiresHumanInTheLoop) feasibility -= 5;
  feasibility = Math.max(0, feasibility);
  const roiPotential = Math.min(100, Math.max(0, Math.round((((estimateAnnualSavings(opp) - estimateImplementationCost(opp)) / estimateImplementationCost(opp)) * 100) / 3)));
  const totalScore = Math.round(businessImpact * 0.30 + Math.min(100, strategicAlignment) * 0.20 + feasibility * 0.25 + roiPotential * 0.25);

  return {
    totalScore,
    priorityBand: totalScore >= 75 ? 'High' : totalScore >= 45 ? 'Medium' : 'Low',
    complexity: calculateComplexity(opp),
    dimensions: { businessImpact, strategicAlignment: Math.min(100, strategicAlignment), feasibility, roiPotential },
    recommendedAutomationType: opp.classification?.recommendedType ?? 'RPA',
    ranking: 0,
  };
}

function calculateComplexity(opp: OpportunityRecord) {
  const characteristics = opp.processCharacteristics ?? {};
  const technical = opp.technical ?? {};
  let score = (technical.applications ?? []).length >= 4 ? 3 : (technical.applications ?? []).length >= 2 ? 2 : 1;
  score += characteristics.dataType === 'Unstructured' ? 4 : characteristics.dataType === 'Semi-Structured' ? 2 : 1;
  score += characteristics.processComplexity === 'High' ? 4 : characteristics.processComplexity === 'Medium' ? 2 : 1;
  if (characteristics.requiresMultiSystemOrchestration) score += 3;
  if (characteristics.requiresReasoning) score += 2;
  if (characteristics.usesGenAI) score += 2;
  if (characteristics.requiresHumanInTheLoop) score += 1;
  score += Math.max(0, (characteristics.autonomyLevel ?? 3) - 2);
  if (score <= 5) return 'XS';
  if (score <= 9) return 'S';
  if (score <= 13) return 'M';
  if (score <= 17) return 'L';
  return 'XL';
}

function generateDiscovery(opp: OpportunityRecord, aiOutput?: string) {
  const steps = aiOutput
    ? String(aiOutput).split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
    : ['Capture request', 'Validate inputs', 'Process transaction', 'Review exceptions', 'Update downstream systems'];

  return {
    asIsSteps: steps,
    processVariants: ['Standard path', 'Exception path'],
    exceptions: ['Missing data', 'System validation failure', 'Approval delay'],
    businessRules: ['High-value items require approval', 'Mandatory fields must be validated before submission'],
    inputs: opp.technical?.dataSources?.length ? opp.technical.dataSources : ['Business request', 'Source records'],
    outputs: ['Validated transaction', 'Audit record', 'Status notification'],
    systems: opp.technical?.applications?.length ? opp.technical.applications : ['Source application', 'Target application'],
    integrations: opp.technical?.applications?.length ? opp.technical.applications.map((app: string) => `${app} connector`) : ['API / file integration'],
    sla: '1 business day',
    complianceRequirements: opp.priority?.complianceImpact === 'High' ? 'Regulatory review required' : 'Standard audit logging',
    humanApprovals: opp.processCharacteristics?.requiresHumanInTheLoop ? ['Process owner approval'] : [],
    dataVolume: `${opp.metrics?.volumePerMonth ?? 0} transactions/month`,
    peakPeriods: opp.priority?.targetTimeline ?? 'Month-end and quarter-end',
  };
}

function generatePrd(opp: OpportunityRecord, aiOutput?: string) {
  const generatedRequirements = aiOutput
    ? String(aiOutput).split('\n').map(line => line.trim()).filter(Boolean)
    : [];
  const discovery = opp.discovery ?? generateDiscovery(opp);
  const metrics = opp.metrics ?? {};
  const impact = opp.impact ?? {};
  const technical = opp.technical ?? {};
  const priority = opp.priority ?? {};
  const characteristics = opp.processCharacteristics ?? {};
  const systems = discovery.systems?.length ? discovery.systems : technical.applications ?? [];
  const integrations = discovery.integrations?.length ? discovery.integrations : systems.map((system: string) => `${system} integration`);
  const dataSources = discovery.inputs?.length ? discovery.inputs : technical.dataSources ?? [];
  const automationType = opp.score?.recommendedAutomationType ?? opp.classification?.recommendedType ?? 'RPA';
  const monthlyVolume = Number(metrics.volumePerMonth ?? 0).toLocaleString();
  const manualEffort = Number(metrics.manualEffortHours ?? 0).toLocaleString();
  const timeSavings = Number(impact.timeSavingsHoursPerMonth ?? 0).toLocaleString();
  const costSavings = Number(impact.costSavingsPerMonth ?? 0).toLocaleString();
  const errorRate = Number(metrics.errorRatePercent ?? 0);
  const usersImpacted = Number(metrics.usersImpacted ?? 0);

  const requirementSeed = [
    `Capture and validate ${opp.processName} requests with mandatory fields for requester, process owner, business unit, transaction context, priority, and supporting evidence before any automation work starts.`,
    `Ingest inputs from ${dataSources.length ? dataSources.join(', ') : 'approved business data sources'} and normalize them into a single auditable work item for downstream processing.`,
    `Execute the discovered happy path: ${discovery.asIsSteps?.join(' -> ') || 'intake -> validation -> processing -> exception review -> downstream update'}.`,
    `Apply business rules explicitly, including ${discovery.businessRules?.join('; ') || 'mandatory validation, routing, exception handling, and audit capture'}.`,
    `Integrate with ${systems.length ? systems.join(', ') : 'the identified source and target systems'} using ${integrations.length ? integrations.join(', ') : 'API, file, or queue based integration patterns'}.`,
    `Route exceptions for human review when ${discovery.exceptions?.join('; ') || 'missing data, validation failure, SLA breach, or policy exception'} occurs, with reason codes and owner assignment.`,
    `Generate status notifications and audit records for submission, validation, exception, approval, completion, and failure events.`,
    `Expose operational reporting for monthly volume (${monthlyVolume}), manual effort baseline (${manualEffort} hours/month), target time savings (${timeSavings} hours/month), and target cost savings ($${costSavings}/month).`,
    `Support ${automationType} delivery patterns while preserving process-owner visibility and rollback controls.`,
  ];

  if (priority.regulatoryRequirement || priority.complianceImpact === 'High') {
    requirementSeed.push('Enforce compliance controls for regulated transactions, including immutable audit trail, evidence retention, access review, and approval traceability.');
  }

  if (characteristics.requiresHumanInTheLoop || discovery.humanApprovals?.length) {
    requirementSeed.push(`Provide human approval queues for ${discovery.humanApprovals?.join(', ') || 'process owner review'} with approve, reject, request-more-information, and escalation outcomes.`);
  }

  return {
    executiveSummary: `${opp.processName} will be automated for ${opp.businessUnit ?? 'the requesting business unit'} to reduce manual effort, improve control, and create measurable operational savings. The current baseline is ${monthlyVolume} transactions/month, ${manualEffort} manual hours/month, ${errorRate}% error rate, and ${usersImpacted} impacted users. The target outcome is ${timeSavings} hours/month and $${costSavings}/month in savings using ${automationType}, with discovery coverage for inputs, rules, exceptions, integrations, auditability, and compliance needs.`,
    userPersonas: [
      `Business User - submits ${opp.processName} requests, provides source evidence, and tracks status.`,
      `Process Owner (${opp.processOwner ?? 'TBD'}) - owns process policy, approvals, exception decisions, and acceptance of business outcomes.`,
      'Automation COE Analyst - validates feasibility, monitors throughput, handles triage, and governs automation performance.',
      'Solution Architect - confirms integration design, security controls, scalability, and operational readiness.',
      ...(priority.regulatoryRequirement || priority.complianceImpact === 'High' ? ['Compliance Reviewer - verifies evidence, audit trail, control coverage, and regulatory obligations.'] : []),
    ],
    functionalRequirements: generatedRequirements.length ? generatedRequirements : requirementSeed,
    nonFunctionalRequirements: [
      `Availability: support business processing during ${discovery.peakPeriods ?? 'normal and peak operating periods'} with graceful degradation when an integrated system is unavailable.`,
      `Performance: process standard transactions within the target SLA of ${discovery.sla ?? '1 business day'} and surface SLA breaches before they become overdue.`,
      `Security: use role-based access for requester, process owner, COE analyst, architect, and reviewer actions; credentials must use least-privilege access.`,
      'Auditability: persist timestamped audit events for every decision, exception, integration attempt, approval, rejection, and manual override.',
      `Scalability: handle at least ${monthlyVolume} transactions/month with configurable thresholds for higher peak volumes.`,
      `Data quality: validate required fields, duplicate submissions, data type mismatches, and missing source evidence before orchestration.`,
      'Observability: provide dashboards for queue size, cycle time, success rate, exception rate, retry count, and failed integration count.',
      'Maintainability: business rules, approval thresholds, notification templates, and routing logic must be configurable without code changes where feasible.',
    ],
    acceptanceCriteria: [
      `Given a complete ${opp.processName} request, when it is submitted, then the system validates inputs, creates an audit record, and routes it into the automated workflow without manual re-keying.`,
      `Given source data from ${dataSources.length ? dataSources.join(', ') : 'configured inputs'}, when validation runs, then missing, duplicate, or malformed data is flagged with clear reason codes.`,
      `Given a transaction that follows the happy path, when processing completes, then downstream systems are updated and the requester/process owner can see final status and audit history.`,
      `Given an exception such as ${discovery.exceptions?.[0] ?? 'missing data'}, when automation cannot complete safely, then the item is routed to the correct owner with context, evidence, and available decisions.`,
      `Given a business rule such as ${discovery.businessRules?.[0] ?? 'mandatory validation'}, when the rule condition is met, then the configured action is enforced and recorded.`,
      `Given a failed integration attempt, when retry limits are reached, then the system records the failure, notifies the owner, and prevents silent data loss.`,
      `Given compliance impact is ${priority.complianceImpact ?? 'Low'}, when an auditor reviews the transaction, then evidence, approvals, timestamps, and user actions are traceable end to end.`,
      `Given operational reporting is opened, when the process owner reviews performance, then volume, cycle time, exception rate, and savings progress are visible for the selected period.`,
    ],
    outOfScope: [
      'Replacing or re-platforming source systems unless explicitly approved as a separate initiative.',
      'Changing business policy, approval authority, or regulatory interpretation without process-owner and compliance sign-off.',
      'Automating transactions with missing mandatory data without an exception path and owner decision.',
      'Building net-new enterprise identity, master data, or reporting platforms beyond the integrations needed for this workflow.',
      'Historical data cleanup outside the records required to validate, test, and launch this automation.',
    ],
    dependencies: [
      `Access to source systems: ${systems.length ? systems.join(', ') : 'source and target applications to be confirmed'}.`,
      `Availability of data inputs: ${dataSources.length ? dataSources.join(', ') : 'source documents, records, and request payloads to be confirmed'}.`,
      `Confirmed business rules: ${discovery.businessRules?.length ? discovery.businessRules.join('; ') : 'validation, routing, exception, and approval rules to be signed off'}.`,
      `Exception ownership for: ${discovery.exceptions?.length ? discovery.exceptions.join('; ') : 'missing data, integration failure, policy exception, and manual review cases'}.`,
      `Security approval for ${automationType} access pattern, credentials, audit logging, and data retention.`,
      `Process owner availability for UAT, acceptance criteria sign-off, and go-live readiness.`,
      `Delivery alignment with target timeline: ${priority.targetTimeline ?? 'timeline to be confirmed'}.`,
    ],
  };
}

function generatePdd(opp: OpportunityRecord) {
  const discovery = opp.discovery ?? generateDiscovery(opp);
  const applications = discovery.systems?.length ? discovery.systems : opp.technical?.applications ?? [];
  return {
    processOverview: [
      `Process: ${opp.processName}`,
      `Purpose: ${opp.description ?? 'To be confirmed'}`,
      `Process owner: ${opp.processOwner ?? 'To be confirmed'}`,
      `Business unit: ${opp.businessUnit ?? 'To be confirmed'}`,
      `Monthly volume: ${opp.metrics?.volumePerMonth ?? 0} transactions`,
    ],
    currentStateSteps: discovery.asIsSteps?.length ? discovery.asIsSteps : ['Complete Discovery to capture current-state steps.'],
    systems: applications.length ? applications : ['Systems to be confirmed.'],
    inputsAndOutputs: [
      `Data sources: ${(opp.technical?.dataSources ?? []).join(', ') || 'To be confirmed'}`,
      `Data type: ${opp.technical?.dataType ?? opp.processCharacteristics?.dataType ?? 'To be confirmed'}`,
      `Data volume: ${discovery.dataVolume ?? 'To be confirmed'}`,
      `Peak periods: ${discovery.peakPeriods ?? 'To be confirmed'}`,
    ],
    businessRules: discovery.businessRules?.length ? discovery.businessRules : ['Business rules to be confirmed.'],
    exceptions: discovery.exceptions?.length ? discovery.exceptions : ['Exception scenarios to be confirmed.'],
    humanApprovals: discovery.humanApprovals?.length ? discovery.humanApprovals : ['Human approvals to be confirmed.'],
    painPointsAndBaseline: [
      `Pain points: ${opp.impact?.painPoints ?? 'To be confirmed'}`,
      `Manual effort: ${opp.metrics?.manualEffortHours ?? 0} hours/month`,
      `Error rate: ${opp.metrics?.errorRatePercent ?? 0}%`,
      `Average handling time: ${opp.metrics?.avgProcessingTimeMinutes ?? 0} minutes`,
    ],
    targetProcess: [
      'Validate incoming data before processing.',
      'Automate standard transactions using the recommended technology.',
      'Route exceptions and approvals to the designated human owner.',
      'Record an auditable result for every transaction.',
    ],
    controls: [
      `SLA: ${discovery.sla ?? 'To be agreed'}`,
      `Compliance requirements: ${discovery.complianceRequirements ?? 'To be confirmed'}`,
      'Apply role-based access, audit logging, exception evidence, and operational monitoring.',
    ],
    openItems: [
      'Validate volumes and exception rates.',
      'Confirm system access, credentials, retention, and business rule ownership.',
    ],
  };
}

function generateSolution(opp: OpportunityRecord) {
  const type = opp.score?.recommendedAutomationType ?? opp.classification?.recommendedType ?? 'RPA';
  const discovery = opp.discovery ?? generateDiscovery(opp);
  const prd = opp.prd ?? generatePrd(opp);
  const metrics = opp.metrics ?? {};
  const impact = opp.impact ?? {};
  const priority = opp.priority ?? {};
  const characteristics = opp.processCharacteristics ?? {};
  const technical = opp.technical ?? {};
  const systems = discovery.systems?.length ? discovery.systems : technical.applications ?? [];
  const integrations = discovery.integrations?.length ? discovery.integrations : systems.map((system: string) => `${system} connector`);
  const dataSources = discovery.inputs?.length ? discovery.inputs : technical.dataSources ?? [];
  const exceptions = discovery.exceptions?.length ? discovery.exceptions : ['missing data', 'validation failure', 'integration failure', 'policy exception'];
  const businessRules = discovery.businessRules?.length ? discovery.businessRules : ['mandatory input validation', 'exception routing', 'audit capture'];
  const monthlyVolume = Number(metrics.volumePerMonth ?? 0).toLocaleString();
  const manualEffort = Number(metrics.manualEffortHours ?? 0).toLocaleString();
  const usersImpacted = Number(metrics.usersImpacted ?? 0).toLocaleString();
  const timeSavings = Number(impact.timeSavingsHoursPerMonth ?? 0).toLocaleString();
  const costSavings = Number(impact.costSavingsPerMonth ?? 0).toLocaleString();
  const complexity = opp.score?.complexity ?? 'M';
  const requiresHumanReview = Boolean(characteristics.requiresHumanInTheLoop || discovery.humanApprovals?.length);
  const complianceLevel = priority.regulatoryRequirement || priority.complianceImpact === 'High'
    ? 'high-control'
    : priority.complianceImpact === 'Medium'
      ? 'standard-control'
      : 'baseline-control';
  const technology = type === 'Power Automate/Power Platform'
    ? 'Power Automate cloud flows, Dataverse, Power Apps, SharePoint, Azure Key Vault, Power BI operational dashboards'
    : type === 'Intelligent Automation'
      ? 'Azure Document Intelligence, Azure Functions, workflow queue, API/RPA worker, Azure Storage, Application Insights'
      : type === 'Hyperautomation/Agentic Automation'
        ? 'Azure OpenAI, agent orchestrator service, enterprise API gateway, vector/context store, workflow queue, human review console'
        : 'UiPath Orchestrator, unattended bot workers, attended review assistant, SQL audit store, API/file integration adapters';

  const intakeLayer = `Intake layer: capture ${opp.processName} requests from ${dataSources.length ? dataSources.join(', ') : 'approved source channels'} with schema validation, duplicate detection, attachment/evidence handling, and requester/process-owner metadata.`;
  const orchestrationLayer = `Orchestration layer: execute ${discovery.asIsSteps?.join(' -> ') || 'intake -> validation -> processing -> exception handling -> downstream update'} using idempotent workflow steps, retry policies, and explicit state transitions.`;
  const rulesLayer = `Rules and decision layer: externalize rules for ${businessRules.join('; ')} so process owners can review thresholds, routing, and exception policy without code changes.`;
  const integrationLayer = `Integration layer: connect to ${systems.length ? systems.join(', ') : 'source and target enterprise systems'} through ${integrations.length ? integrations.join(', ') : 'API, file, queue, or RPA adapters'} with correlation IDs and retry/error handling.`;
  const exceptionLayer = `Exception layer: route ${exceptions.join('; ')} to the correct owner with source evidence, recommended action, SLA timer, approve/reject/request-info outcomes, and full audit history.`;
  const reportingLayer = `Reporting layer: expose throughput, cycle time, exception rate, SLA adherence, automation success rate, monthly volume (${monthlyVolume}), target savings (${timeSavings} hours/month and $${costSavings}/month), and user impact (${usersImpacted} users).`;

  return {
    toBeSummary: `Enterprise ${type} solution for ${opp.processName}: implement a governed, observable automation capability for ${opp.businessUnit ?? 'the business unit'} that handles intake, validation, rule execution, system updates, exception management, and audit reporting. The design targets ${monthlyVolume} transactions/month, reduces the ${manualEffort} manual hours/month baseline, supports ${usersImpacted} impacted users, and preserves process-owner control through configurable rules, evidence tracking, and ${complianceLevel} governance.`,
    recommendedTechnology: technology,
    architectureSummary: [
      intakeLayer,
      orchestrationLayer,
      rulesLayer,
      integrationLayer,
      exceptionLayer,
      reportingLayer,
      `Control plane: maintain role-based access, environment promotion, configuration versioning, audit retention, and operational runbooks for support teams.`,
    ].join(' '),
    components: [
      `Experience and intake console - role-based UI for request submission, evidence upload, status tracking, process-owner review, and operational triage.`,
      `Canonical workflow data model - normalized work item containing requester, process owner, business unit, source payload, validation status, exception state, audit trail, and downstream transaction references.`,
      `Validation service - checks required fields, data types, duplicate requests, policy thresholds, and source evidence before orchestration begins.`,
      `Rules engine - implements configurable rules such as ${businessRules.slice(0, 3).join('; ')} with versioned changes and approval history.`,
      `Workflow orchestrator - coordinates validation, automation execution, human review, integration retries, notifications, and state transitions from PRD acceptance through ROI approval.`,
      `Automation worker layer - ${type} execution workers for deterministic tasks, document understanding, API orchestration, RPA execution, or agent-assisted reasoning depending on the selected automation pattern.`,
      `Integration adapters - connectors for ${systems.length ? systems.join(', ') : 'source systems, target systems, email, file stores, and enterprise APIs'} with retry, timeout, reconciliation, and dead-letter handling.`,
      `Exception and approval workbench - queues failed, ambiguous, high-risk, or policy-controlled items for owner decision with context, evidence, recommended action, and SLA tracking.`,
      `Audit and evidence store - immutable event log for submissions, validations, rule decisions, approvals, integration calls, retries, overrides, and final outcomes.`,
      `Monitoring and reporting dashboard - operational KPIs, automation success rate, exception aging, SLA breaches, savings realization, and compliance evidence export.`,
      `Configuration and governance module - stage settings, thresholds, routing owners, notification templates, credentials references, environment variables, and release notes.`,
    ],
    integrations: [
      ...(integrations.length ? integrations : ['Enterprise API integration', 'Secure file exchange', 'Email/notification channel']),
      `Identity provider for SSO and role-based access control`,
      `Secrets vault for credentials, API keys, bot accounts, and certificate material`,
      `Enterprise logging/SIEM feed for audit, security monitoring, and incident investigation`,
      `Reporting layer for operational, savings, and compliance dashboards`,
    ],
    humanInLoopDesign: requiresHumanReview
      ? `Human-in-the-loop is designed as a governed review queue, not an ad hoc email step. Items enter review when ${exceptions.join('; ')} occurs or when a configured policy threshold is met. Reviewers receive the source evidence, rule outcome, recommended decision, SLA age, and impact context; they can approve, reject, request more information, reassign, or override with mandatory reason capture. All decisions are written to the audit store and become available for compliance reporting.`
      : `Human review is exception-based. Standard transactions run straight-through after validation, while low-confidence, failed integration, missing evidence, SLA breach, or manual override cases are routed to a controlled workbench with reason codes and audit capture.`,
    securityConsiderations: [
      `Access control: enforce least-privilege RBAC for requester, process owner, COE analyst, solution architect, finance/compliance reviewer, and support roles.`,
      `Credential security: store service credentials and bot/API secrets in a vault; rotate credentials and avoid embedding secrets in workflow definitions.`,
      `Data protection: encrypt data in transit and at rest, mask sensitive fields in logs, and retain only the evidence required for operational and compliance needs.`,
      `Auditability: persist immutable audit events with actor, role, timestamp, source system, correlation ID, rule version, decision, and before/after status.`,
      `Compliance: use ${complianceLevel} controls based on regulatory requirement=${Boolean(priority.regulatoryRequirement)} and compliance impact=${priority.complianceImpact ?? 'Low'}.`,
      `Resilience: isolate failures using retries, dead-letter queues, manual recovery workflows, and reconciliation reports so downstream systems are not silently inconsistent.`,
    ].join(' '),
    monitoringStrategy: [
      `Operational KPIs: transactions received, transactions completed, automation success rate, average cycle time, SLA breaches, queue backlog, and exception aging.`,
      `Quality KPIs: validation failure rate, duplicate rate, integration retry count, manual override count, rework rate, and post-automation error rate against the ${metrics.errorRatePercent ?? 0}% baseline.`,
      `Business KPIs: realized time savings versus ${timeSavings} hours/month target, realized cost savings versus $${costSavings}/month target, and productivity impact for ${usersImpacted} users.`,
      `Technical telemetry: workflow step duration, API latency, bot runtime, document extraction confidence, queue depth, dead-letter count, and downstream reconciliation status.`,
      `Alerts: notify support/process owner on SLA breach risk, repeated integration failures, stuck work items, high exception spikes, credential failures, or audit write failures.`,
    ].join(' '),
    scalabilityNotes: `Use queue-based orchestration with stateless workers so processing capacity can scale for ${discovery.peakPeriods ?? 'peak periods'} and for at least ${monthlyVolume} transactions/month. Partition workloads by business unit, source system, or priority; use idempotent transaction keys to prevent duplicate downstream updates. For ${complexity} complexity, start with a controlled pilot, then scale by adding workers/connectors and hardening runbooks, monitoring, and exception staffing. The design should support blue/green releases, lower-environment test data, feature flags for major rule changes, and rollback to manual processing for critical outages.`,
    estimatedEffort: `${complexity} complexity enterprise delivery: ${opp.businessCase?.timelineWeeks ?? 10}-${(opp.businessCase?.timelineWeeks ?? 10) + 6} weeks across discovery validation, detailed design, integration build, automation implementation, security review, UAT, production readiness, and hypercare. PRD scope includes ${prd.functionalRequirements?.length ?? 0} functional requirements and ${prd.acceptanceCriteria?.length ?? 0} acceptance criteria.`,
  };
}

function calculateRoi(inputs: any) {
  const netAnnualBenefit = inputs.annualSavings - inputs.annualSupportCost;
  const roiPercentage = inputs.implementationCost > 0 ? Math.round(((netAnnualBenefit - inputs.implementationCost) / inputs.implementationCost) * 100) : 0;
  const paybackPeriodMonths = netAnnualBenefit > 0 ? Math.round((inputs.implementationCost / (netAnnualBenefit / 12)) * 10) / 10 : 0;
  let npv = -inputs.implementationCost;
  for (let year = 1; year <= 3; year++) npv += netAnnualBenefit / Math.pow(1.1, year);
  let breakEvenMonths = 0;
  let cumulative = -inputs.implementationCost;
  while (cumulative < 0 && breakEvenMonths < 60) {
    breakEvenMonths++;
    cumulative += netAnnualBenefit / 12;
  }
  return { ...inputs, roiPercentage, paybackPeriodMonths, npv: Math.round(npv), breakEvenMonths };
}

function recommendPod(opp: OpportunityRecord) {
  return pods.find(pod => pod.specialization === opp.classification?.recommendedType && pod.currentCapacity > 20) ?? [...pods].sort((a, b) => b.currentCapacity - a.currentCapacity)[0];
}

function generateBacklog(opp: OpportunityRecord) {
  const prefix = String(opp.id ?? 'AUTO').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase();
  const acceptanceCriteria = [
    'Given valid inputs, when the story flow runs, then the expected result is saved with an audit record.',
    'Given invalid or exceptional data, when processing cannot continue, then the case is routed with a clear reason and owner.',
    'Given an authorized user, when they review the result, then all relevant status, timestamps, and evidence are visible.',
  ];
  return [
    { jiraKey: `${prefix}-001`, title: `Create ${opp.processName} automation epic`, description: 'Define delivery scope and acceptance criteria.', acceptanceCriteria, type: 'Epic', priority: opp.priority?.businessPriority ?? 'Medium', status: 'To Do', storyPoints: 8, assignee: 'Product Owner', sprint: 'Sprint 1' },
    { jiraKey: `${prefix}-002`, title: 'Build integration and validation workflow', description: 'Implement core automation logic and integrations.', acceptanceCriteria, type: 'Story', priority: 'High', status: 'To Do', storyPoints: 13, assignee: 'Automation Engineer', sprint: 'Sprint 1' },
    { jiraKey: `${prefix}-003`, title: 'Configure exception handling and audit trail', description: 'Expose exceptions and audit records for operations.', acceptanceCriteria, type: 'Story', priority: 'Medium', status: 'To Do', storyPoints: 8, assignee: 'Solution Architect', sprint: 'Sprint 2' },
  ];
}

function determineSprintReadiness(opp: OpportunityRecord) {
  const gates = [
    { name: 'Classification Complete', passed: !!opp.classification, description: 'Automation type has been classified and accepted' },
    { name: 'L1 Qualification Passed', passed: opp.qualification?.status === 'Qualified', description: 'Opportunity passed L1 qualification checks' },
    { name: 'Opportunity Scored', passed: !!opp.score?.totalScore, description: 'Priority scoring has been completed' },
    { name: 'L2 Discovery Complete', passed: !!opp.discovery?.asIsSteps?.length, description: 'Process discovery completed' },
    { name: 'PDD Complete', passed: !!opp.pdd, description: 'Process definition document is complete' },
    { name: 'SDD Complete', passed: !!opp.solution, description: 'Solution design document is complete' },
    { name: 'ROI Approved', passed: !!opp.businessCase?.roiPercentage, description: 'Business case and ROI are approved' },
    { name: 'Pod Allocated', passed: !!opp.podAllocation, description: 'Delivery pod is assigned' },
    { name: 'Compliance Cleared', passed: Array.isArray(opp.complianceChecks) && opp.complianceChecks.every((check: any) => check.status === 'Passed' || check.status === 'Not Applicable'), description: 'Compliance checks passed' },
    { name: 'Backlog Items Created', passed: !!opp.backlogItems?.length, description: 'Backlog items are ready' },
  ];
  const passedCount = gates.filter(gate => gate.passed).length;
  const readinessScore = Math.round((passedCount / gates.length) * 100);
  return {
    status: passedCount === gates.length ? 'Sprint Ready' : passedCount >= gates.length - 2 ? 'Blocked' : 'Not Ready',
    readinessScore,
    gates,
    blockers: gates.filter(gate => !gate.passed).map(gate => `${gate.name}: ${gate.description}`),
    targetSprintDate: nextMonday(),
  };
}

function generateComplianceChecks() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { name: 'Security Review', status: 'Passed', details: 'No blocking security findings for current scope.', checkedBy: 'System', checkedDate: today },
    { name: 'Data Privacy Review', status: 'Passed', details: 'Personal data handling reviewed for automation scope.', checkedBy: 'System', checkedDate: today },
  ];
}

function estimateAnnualSavings(opp: OpportunityRecord) {
  return ((opp.impact?.costSavingsPerMonth ?? 0) + (opp.impact?.timeSavingsHoursPerMonth ?? 0) * 50) * 12 || 150000;
}

function estimateImplementationCost(opp: OpportunityRecord) {
  const multiplier = opp.processCharacteristics?.processComplexity === 'High' ? 3 : opp.processCharacteristics?.processComplexity === 'Medium' ? 2 : 1;
  return multiplier * 50000;
}

function nextMonday() {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  return new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function titleForDoc(docType: string) {
  return docType === 'prd'
    ? 'Product Requirements Document'
    : docType === 'pdd'
      ? 'Process Definition Document'
    : docType === 'business-case'
      ? 'Business Case'
      : docType === 'solution-design'
        ? 'Solution Design'
        : docType === 'sprint-backlog'
          ? 'Sprint Backlog'
          : 'Document';
}
