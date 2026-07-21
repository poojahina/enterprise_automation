import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { FileText, Download, Printer, Share2 } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import type { AutomationOpportunity, BacklogItem } from '../../models/types';
import { apiFetch } from '../../utils/api';

type DocType = 'prd' | 'pdd' | 'business-case' | 'solution-design' | 'sprint-backlog';
type DocumentSection = { title: string; lines: string[] };

const DocumentsPage: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities[0]?.id ?? '');
  const [activeDoc, setActiveDoc] = useState<DocType>('prd');
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const opp = opportunities.find(o => o.id === selectedId);
  const sections = opp ? buildDocumentSections(opp, activeDoc) : [];

  const syncToSharePoint = async () => {
    if (!opp) return;
    setSyncing(true);
    try {
      const res = await apiFetch('/api/integrations/sharepoint/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opp.id, documentId: activeDoc })
      });
      const data = await res.json();
      alert(data.success ? data.message : 'Sync failed');
    } catch (error) {
      alert('Error syncing to SharePoint');
    } finally {
      setSyncing(false);
    }
  };

  const exportDocument = async () => {
    if (!opp) return;
    setExporting(true);
    try {
      const res = await apiFetch(`/api/documents/${opp.id}/${activeDoc}/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${opp.id}-${activeDoc}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const docs: { type: DocType; title: string; available: boolean }[] = [
    { type: 'prd', title: 'Product Requirements Document', available: !!opp },
    { type: 'pdd', title: 'Process Definition Document', available: !!opp },
    { type: 'business-case', title: 'Business Case Document', available: !!opp },
    { type: 'solution-design', title: 'Solution Design Document', available: !!opp },
    { type: 'sprint-backlog', title: 'Sprint Backlog Export', available: !!opp },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="documents-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Document Generation</h1>
          <p className="text-sm text-gray-400">Preview and export detailed PRD, business case, solution design, and sprint backlog documents</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Opportunity:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} - {o.processName}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {docs.map(doc => (
          <button
            key={doc.type}
            onClick={() => setActiveDoc(doc.type)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeDoc === doc.type ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            } ${!doc.available ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={!doc.available}
          >
            {doc.title}
          </button>
        ))}
      </div>

      <AnimatedCard className="max-w-5xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">{docs.find(d => d.type === activeDoc)?.title}</h2>
            {opp && <p className="text-xs text-gray-400 mt-1">{opp.id} - {opp.processName}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={syncToSharePoint}
              disabled={!opp || syncing}
              className="flex items-center gap-1 bg-white/5 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Share2 className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse text-blue-400' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to SharePoint'}
            </button>
            <button onClick={() => window.print()} disabled={!opp} className="flex items-center gap-1 bg-white/5 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={exportDocument} disabled={!opp || exporting} className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {opp ? (
          <div className="space-y-4 text-sm">
            {sections.map((section) => (
              <div key={section.title} className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-200 mb-2">{section.title}</h3>
                <ul className="space-y-1.5">
                  {section.lines.map((line, index) => (
                    <li key={`${section.title}-${index}`} className="text-gray-300 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 mt-2" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">Select an opportunity to generate detailed documents.</p>
        )}
      </AnimatedCard>
    </div>
  );
};

function buildDocumentSections(opp: AutomationOpportunity, docType: DocType): DocumentSection[] {
  const prd = opp.prd ?? fallbackPrd(opp);
  const solution = opp.solution ?? fallbackSolution(opp);
  const businessCase = opp.businessCase ?? fallbackBusinessCase(opp);
  const backlog = opp.backlogItems.length > 0 ? opp.backlogItems : fallbackBacklog(opp);
  const header: DocumentSection = {
    title: 'Document Control',
    lines: [
      `Opportunity ID: ${opp.id}`,
      `Current stage: ${opp.currentStage}`,
      `Business unit: ${opp.businessUnit || 'N/A'}`,
      `Process owner: ${opp.processOwner || 'N/A'}`,
      `Automation type: ${opp.classification?.recommendedType ?? opp.score?.recommendedAutomationType ?? 'To be confirmed'}`,
      `Priority: ${opp.score?.priorityBand ?? opp.priority.businessPriority} | Complexity: ${opp.score?.complexity ?? opp.processCharacteristics.processComplexity}`,
    ],
  };

  if (docType === 'prd') {
    return [
      header,
      { title: '1. Executive Summary', lines: [prd.executiveSummary] },
      { title: '2. Personas and Stakeholders', lines: prd.userPersonas },
      { title: '3. Functional Requirements', lines: prd.functionalRequirements.map((item, index) => `FR-${index + 1}: ${item}`) },
      { title: '4. Non-Functional Requirements', lines: prd.nonFunctionalRequirements.map((item, index) => `NFR-${index + 1}: ${item}`) },
      { title: '5. Acceptance Criteria', lines: prd.acceptanceCriteria.map((item, index) => `AC-${index + 1}: ${item}`) },
      { title: '6. Out of Scope', lines: prd.outOfScope },
      { title: '7. Dependencies', lines: prd.dependencies },
    ];
  }

  if (docType === 'pdd') {
    const pdd = opp.pdd;
    return pdd ? [
      header,
      { title: '1. Process Overview', lines: pdd.processOverview },
      { title: '2. Current-State Process (As-Is)', lines: pdd.currentStateSteps },
      { title: '3. Systems and Applications', lines: pdd.systems },
      { title: '4. Inputs and Outputs', lines: pdd.inputsAndOutputs },
      { title: '5. Business Rules', lines: pdd.businessRules },
      { title: '6. Exceptions', lines: pdd.exceptions },
      { title: '7. Human Decisions and Approvals', lines: pdd.humanApprovals },
      { title: '8. Pain Points and Baseline', lines: pdd.painPointsAndBaseline },
      { title: '9. Target Process (To-Be)', lines: pdd.targetProcess },
      { title: '10. Controls, SLA, and Compliance', lines: pdd.controls },
      { title: '11. Assumptions and Open Items', lines: pdd.openItems },
    ] : [header, { title: 'PDD Not Generated', lines: ['Open PDD Creation and generate the process definition first.'] }];
  }

  if (docType === 'business-case') {
    return [
      header,
      { title: '1. Executive Summary', lines: [
        `${opp.processName} is proposed to reduce manual effort, improve control, and deliver measurable operational savings for ${opp.businessUnit || 'the business unit'}.`,
        `The opportunity targets ${opp.impact.timeSavingsHoursPerMonth} hours/month and $${opp.impact.costSavingsPerMonth.toLocaleString()}/month in savings.`,
      ] },
      { title: '2. Baseline and Impact', lines: [
        `Monthly volume: ${opp.metrics.volumePerMonth.toLocaleString()} transactions`,
        `Manual effort: ${opp.metrics.manualEffortHours.toLocaleString()} hours/month`,
        `Current error rate: ${opp.metrics.errorRatePercent}%`,
        `Users impacted: ${opp.metrics.usersImpacted.toLocaleString()}`,
        `Pain points: ${opp.impact.painPoints || 'To be confirmed'}`,
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
      { title: '4. Assumptions, Risks, and Dependencies', lines: [
        `Timeline: ${businessCase.timelineWeeks} weeks`,
        `Effort: ${businessCase.effortStoryPoints} story points`,
        `Systems: ${listOrFallback(opp.technical.applications, 'Source and target systems to be confirmed')}`,
        `Data sources: ${listOrFallback(opp.technical.dataSources, 'Input data sources to be confirmed')}`,
        'Risks: access delays, data quality gaps, exception ownership, business rule sign-off, and support readiness.',
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

  return [
    header,
    { title: '1. Backlog Summary', lines: [
      `Backlog item count: ${backlog.length}`,
      `Total story points: ${backlog.reduce((sum, item) => sum + item.storyPoints, 0)}`,
      `Primary delivery priority: ${opp.priority.businessPriority}`,
    ] },
    { title: '2. Sprint Backlog Items', lines: backlog.map(item => `${item.jiraKey} | ${item.type} | ${item.priority} | ${item.storyPoints} SP | ${item.assignee} | ${item.sprint} | ${item.title} - ${item.description}`) },
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

function fallbackPrd(opp: AutomationOpportunity) {
  return {
    executiveSummary: `${opp.processName} will be automated to reduce manual effort, improve quality, and provide auditable workflow control for ${opp.businessUnit || 'the business unit'}.`,
    userPersonas: ['Business User - submits requests and tracks status.', `Process Owner (${opp.processOwner || 'TBD'}) - owns rules, approvals, and acceptance.`, 'Automation COE Analyst - monitors throughput and handles triage.', 'Solution Architect - validates integration, security, and scalability.'],
    functionalRequirements: [
      `Capture and validate ${opp.processName} requests with requester, owner, business unit, priority, and supporting evidence.`,
      `Ingest source data from ${listOrFallback(opp.technical.dataSources, 'approved source records')}.`,
      `Apply business rules and route exceptions for review with reason codes and ownership.`,
      `Integrate with ${listOrFallback(opp.technical.applications, 'identified enterprise systems')}.`,
      'Generate status notifications, audit records, and operational reporting.',
    ],
    nonFunctionalRequirements: ['Role-based access control.', 'Encrypted data in transit and at rest.', 'Audit trail for every decision and integration attempt.', 'SLA monitoring and operational dashboards.', 'Configurable rules and routing.'],
    acceptanceCriteria: ['Complete requests process without manual re-keying.', 'Missing or invalid data is rejected with clear reason codes.', 'Exceptions are routed to the correct owner.', 'Audit history is visible end to end.', 'Operational dashboard shows volume, cycle time, and exception rate.'],
    outOfScope: ['Replacing source systems.', 'Changing business policy without approval.', 'Historical data cleanup outside launch scope.'],
    dependencies: [`Access to ${listOrFallback(opp.technical.applications, 'source and target systems')}.`, 'Business rule sign-off.', 'Process owner availability for UAT.', 'Security approval for credentials and audit logging.'],
  };
}

function fallbackSolution(opp: AutomationOpportunity) {
  const rawType = opp.score?.recommendedAutomationType ?? opp.classification?.recommendedType ?? 'Power Platform';
  const type = rawType === 'RPA' ? 'Automation Anywhere'
    : rawType === 'Power Automate/Power Platform' ? 'Power Platform'
    : rawType === 'Intelligent Automation' || rawType === 'Hyperautomation/Agentic Automation' ? 'Azure AI'
    : rawType;
  return {
    toBeSummary: `Enterprise ${type} solution for ${opp.processName}, covering intake, validation, orchestration, exception handling, audit, and reporting.`,
    recommendedTechnology: type === 'Power Platform'
      ? 'Power Apps, Power Automate, Dataverse, approved connectors, and Power BI'
      : type === 'Automation Anywhere'
        ? 'Automation Anywhere Control Room, Bot Creator, Bot Runners, credential vault, workload queues, and Bot Insight'
        : 'Microsoft Foundry, Azure OpenAI, Azure AI Search, Azure Document Intelligence, Content Safety, and Application Insights',
    architectureSummary: 'Intake layer -> validation/rules -> workflow orchestration -> automation workers -> integration adapters -> exception workbench -> audit and reporting.',
    components: ['Intake console', 'Canonical workflow data model', 'Validation service', 'Rules engine', 'Workflow orchestrator', 'Automation worker layer', 'Integration adapters', 'Exception and approval workbench', 'Audit store', 'Monitoring dashboard'],
    integrations: [...opp.technical.applications, 'Identity provider', 'Secrets vault', 'Enterprise logging/SIEM', 'Reporting layer'].filter(Boolean),
    humanInLoopDesign: opp.processCharacteristics.requiresHumanInTheLoop ? 'Controlled approval queue for high-risk, incomplete, or exception cases with mandatory reason capture.' : 'Straight-through processing for standard transactions, with exception-only human review.',
    securityConsiderations: 'Use least-privilege RBAC, vault-managed credentials, encrypted data, immutable audit logs, and compliance-ready evidence retention.',
    monitoringStrategy: 'Track throughput, cycle time, SLA breaches, exception aging, retry count, failed integrations, realized savings, and audit failures.',
    scalabilityNotes: `Queue-based orchestration scales workers for at least ${opp.metrics.volumePerMonth.toLocaleString()} transactions/month and supports peak processing windows.`,
    estimatedEffort: `${opp.score?.complexity ?? opp.processCharacteristics.processComplexity} complexity delivery: 10-16 weeks including design, build, integration, security review, UAT, release, and hypercare.`,
  };
}

function fallbackBusinessCase(opp: AutomationOpportunity) {
  const annualSavings = ((opp.impact.costSavingsPerMonth || 0) + (opp.impact.timeSavingsHoursPerMonth || 0) * 50) * 12 || 150000;
  const implementationCost = opp.processCharacteristics.processComplexity === 'High' ? 150000 : opp.processCharacteristics.processComplexity === 'Medium' ? 100000 : 50000;
  const annualSupportCost = 20000;
  const netAnnualBenefit = annualSavings - annualSupportCost;
  const roiPercentage = Math.round(((netAnnualBenefit - implementationCost) / implementationCost) * 100);
  const paybackPeriodMonths = netAnnualBenefit > 0 ? Math.round((implementationCost / (netAnnualBenefit / 12)) * 10) / 10 : 0;
  const npv = Math.round(-implementationCost + netAnnualBenefit / 1.1 + netAnnualBenefit / Math.pow(1.1, 2) + netAnnualBenefit / Math.pow(1.1, 3));
  return { implementationCost, annualSavings, annualSupportCost, roiPercentage, paybackPeriodMonths, npv, breakEvenMonths: Math.ceil(paybackPeriodMonths), effortStoryPoints: 80, timelineWeeks: 12, fteReduction: Math.max(1, Math.round((opp.impact.timeSavingsHoursPerMonth || 40) / 160)) };
}

function fallbackBacklog(opp: AutomationOpportunity): BacklogItem[] {
  const prefix = opp.id.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase() || 'AUTO';
  return [
    { jiraKey: `${prefix}-001`, title: `Create ${opp.processName} automation epic`, description: 'Define delivery scope, success metrics, controls, and acceptance criteria.', type: 'Epic', priority: opp.priority.businessPriority, status: 'To Do', storyPoints: 8, assignee: 'Product Owner', sprint: 'Sprint 1' },
    { jiraKey: `${prefix}-002`, title: 'Build intake and validation workflow', description: 'Implement request capture, data validation, duplicate checks, and audit event creation.', type: 'Story', priority: 'High', status: 'To Do', storyPoints: 13, assignee: 'Automation Engineer', sprint: 'Sprint 1' },
    { jiraKey: `${prefix}-003`, title: 'Configure integrations and exception handling', description: 'Connect source/target systems, retries, dead-letter handling, and exception routing.', type: 'Story', priority: 'High', status: 'To Do', storyPoints: 13, assignee: 'Solution Architect', sprint: 'Sprint 2' },
    { jiraKey: `${prefix}-004`, title: 'Create monitoring and readiness controls', description: 'Build operational dashboard, UAT evidence, support runbook, and release checklist.', type: 'Story', priority: 'Medium', status: 'To Do', storyPoints: 8, assignee: 'Scrum Master', sprint: 'Sprint 2' },
  ];
}

function listOrFallback(items: string[], fallback: string) {
  return items.length ? items.join(', ') : fallback;
}

export default DocumentsPage;
