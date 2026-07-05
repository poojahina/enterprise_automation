// ─── Role Types ───────────────────────────────────────────────
export type Role = 'Business User' | 'Automation COE Analyst' | 'Solution Architect' | 'Product Owner';

// ─── Automation Type ──────────────────────────────────────────
export type AutomationType =
  | 'Hyperautomation/Agentic Automation'
  | 'RPA'
  | 'Intelligent Automation'
  | 'Power Automate/Power Platform';

// ─── Pipeline Status ──────────────────────────────────────────
export type PipelineStage =
  | 'Submitted'
  | 'Classified'
  | 'Qualified'
  | 'Scored'
  | 'Discovery'
  | 'PDD Creation'
  | 'A2B Readiness Check'
  | 'SDD Creation'
  | 'ROI Approved'
  | 'Prioritized'
  | 'Pod Allocated'
  | 'Sprint Ready';

// ─── Process Characteristics (for classification) ─────────────
export interface ProcessCharacteristics {
  isRuleBased: boolean;
  requiresReasoning: boolean;
  requiresMultiSystemOrchestration: boolean;
  usesGenAI: boolean;
  requiresDocumentUnderstanding: boolean;
  isWorkflowAutomation: boolean;
  hasAPIAvailability: boolean;
  requiresHumanInTheLoop: boolean;
  autonomyLevel: number; // 1-5 (1=fully manual, 5=fully autonomous)
  dataType: 'Structured' | 'Semi-Structured' | 'Unstructured';
  processComplexity: 'Low' | 'Medium' | 'High';
}

// ─── Impact ───────────────────────────────────────────────────
export interface Impact {
  painPoints: string;
  timeSavingsHoursPerMonth: number;
  costSavingsPerMonth: number;
  riskReduction: string;
  qualityImprovement: string;
  strategicAlignment: 'Low' | 'Medium' | 'High';
}

// ─── Technical Info ───────────────────────────────────────────
export interface TechnicalInfo {
  applications: string[];
  dataSources: string[];
  dataType: 'Structured' | 'Semi-Structured' | 'Unstructured';
  currentAutomationLevel: number; // 0-100%
}

// ─── Process Metrics ──────────────────────────────────────────
export interface ProcessMetrics {
  volumePerMonth: number;
  frequencyPerMonth: number;
  manualEffortHours: number;
  errorRatePercent: number;
  usersImpacted: number;
  avgProcessingTimeMinutes: number;
}

// ─── Priority Info ────────────────────────────────────────────
export interface PriorityInfo {
  businessPriority: 'Critical' | 'High' | 'Medium' | 'Low';
  targetTimeline: string;
  complianceImpact: 'High' | 'Medium' | 'Low' | 'None';
  regulatoryRequirement: boolean;
}

// ─── Classification Result ───────────────────────────────────
export interface ClassificationResult {
  recommendedType: AutomationType;
  confidenceScore: number; // 0-100
  reasoning: string;
  assumptions: string[];
  alternatives: Array<{ type: AutomationType; score: number; reason: string }>;
  matchScores: Record<AutomationType, number>;
}

// ─── Qualification Result ────────────────────────────────────
export interface QualificationResult {
  status: 'Qualified' | 'Rejected' | 'Needs More Information';
  overallScore: number; // 0-100
  checks: QualificationCheck[];
  missingInfo: string[];
  recommendation: string;
}

export interface QualificationCheck {
  name: string;
  passed: boolean;
  details: string;
  weight: number;
}

// ─── Opportunity Score ───────────────────────────────────────
export interface OpportunityScore {
  totalScore: number; // 0-100
  priorityBand: 'High' | 'Medium' | 'Low';
  complexity: 'XS' | 'S' | 'M' | 'L' | 'XL';
  dimensions: {
    businessImpact: number;
    strategicAlignment: number;
    feasibility: number;
    roiPotential: number;
  };
  recommendedAutomationType: AutomationType;
  ranking: number;
}

// ─── Discovery Assessment ────────────────────────────────────
export interface DiscoveryAssessment {
  asIsSteps: string[];
  processVariants: string[];
  exceptions: string[];
  businessRules: string[];
  inputs: string[];
  outputs: string[];
  systems: string[];
  integrations: string[];
  sla: string;
  complianceRequirements: string;
  humanApprovals: string[];
  dataVolume: string;
  peakPeriods: string;
}

// ─── Product Requirements Document (PRD) ──────────────────────
export interface ProductRequirementsDocument {
  executiveSummary: string;
  userPersonas: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  acceptanceCriteria: string[];
  outOfScope: string[];
  dependencies: string[];
}

export interface ProcessDefinitionDocument {
  processOverview: string[];
  currentStateSteps: string[];
  systems: string[];
  inputsAndOutputs: string[];
  businessRules: string[];
  exceptions: string[];
  humanApprovals: string[];
  painPointsAndBaseline: string[];
  targetProcess: string[];
  controls: string[];
  openItems: string[];
}

export type A2BDecision = 'READY' | 'NOT_READY' | 'READY_WITH_RISKS' | 'NOT_RUN';
export interface A2BResult {
  id: string;
  criterionId: string;
  criterionName: string;
  category: string;
  severity: 'mandatory' | 'recommended' | 'optional';
  status: 'passed' | 'failed' | 'partial' | 'not_applicable';
  confidenceScore: number;
  evidenceFound: string;
  missingInformation: string;
  recommendation: string;
  sourceDocumentId?: string;
  sourceLocation?: string;
}

// ─── Solution Recommendation ─────────────────────────────────
export interface SolutionRecommendation {
  toBeSummary: string;
  recommendedTechnology: string;
  architectureSummary: string;
  components: string[];
  integrations: string[];
  humanInLoopDesign: string;
  securityConsiderations: string;
  monitoringStrategy: string;
  scalabilityNotes: string;
  estimatedEffort: string;
}

// ─── Business Case / ROI ─────────────────────────────────────
export interface BusinessCase {
  implementationCost: number;
  annualSavings: number;
  annualSupportCost: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
  npv: number;
  breakEvenMonths: number;
  effortStoryPoints: number;
  timelineWeeks: number;
  fteReduction: number;
}

// ─── Backlog Item (Jira Simulation) ──────────────────────────
export interface BacklogItem {
  jiraKey: string;
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  type: 'Epic' | 'Story' | 'Task' | 'Sub-task';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
  storyPoints: number;
  assignee: string;
  sprint: string;
}

// ─── Pod Allocation ──────────────────────────────────────────
export interface PodAllocation {
  podName: string;
  podLead: string;
  teamSize: number;
  skills: string[];
  currentCapacity: number; // percentage available
  assignedOpportunities: number;
  specialization: AutomationType;
  deliveryRisk: 'Low' | 'Medium' | 'High';
  notes: string;
}

// ─── Sprint Readiness ────────────────────────────────────────
export interface SprintReadiness {
  status: 'Sprint Ready' | 'Blocked' | 'Not Ready';
  readinessScore: number; // 0-100
  gates: SprintGate[];
  blockers: string[];
  targetSprintDate: string;
}

export interface SprintGate {
  name: string;
  passed: boolean;
  description: string;
}

// ─── Compliance Check ────────────────────────────────────────
export interface ComplianceCheck {
  name: string;
  status: 'Passed' | 'Failed' | 'Pending' | 'Not Applicable';
  details: string;
  checkedBy: string;
  checkedDate: string;
}

// ─── Audit Trail ─────────────────────────────────────────────
export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  role: Role;
  details: string;
  stage: PipelineStage;
}

// ─── Full Opportunity (Pipeline Object) ──────────────────────
export interface AutomationOpportunity {
  id: string;
  processName: string;
  description: string;
  businessUnit: string;
  processOwner: string;
  submittedBy: string;
  submittedDate: string;
  currentStage: PipelineStage;

  // Process details
  processCharacteristics: ProcessCharacteristics;
  impact: Impact;
  technical: TechnicalInfo;
  metrics: ProcessMetrics;
  priority: PriorityInfo;

  // Pipeline results
  classification: ClassificationResult | null;
  qualification: QualificationResult | null;
  score: OpportunityScore | null;
  discovery: DiscoveryAssessment | null;
  prd: ProductRequirementsDocument | null;
  pdd?: ProcessDefinitionDocument | null;
  solution: SolutionRecommendation | null;
  businessCase: BusinessCase | null;
  backlogItems: BacklogItem[];
  podAllocation: PodAllocation | null;
  sprintReadiness: SprintReadiness | null;

  // Governance
  complianceChecks: ComplianceCheck[];
  auditTrail: AuditTrailEntry[];
}

// ─── Dashboard KPI ───────────────────────────────────────────
export interface DashboardKPI {
  label: string;
  value: number | string;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  icon: string;
}
