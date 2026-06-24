import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding synthetic opportunities...');

  const opps = [
    {
      id: 'OPP-001',
      processName: 'Invoice Processing Automation',
      description: 'Automate the extraction of data from PDF invoices and entry into SAP.',
      businessUnit: 'Finance',
      submitter: 'Jane Doe',
      currentStage: 'Intake',
      pipelineStatus: 'Active',
      classification: {
        recommendedType: 'Intelligent Automation',
        confidenceScore: 92,
        reasoning: 'Unstructured PDF documents require OCR and ML extraction before structured data entry.',
        matchScores: { 'RPA': 40, 'Intelligent Automation': 92, 'Hyperautomation/Agentic Automation': 50, 'Power Automate/Power Platform': 30 },
        alternatives: [],
        assumptions: ['Invoices are somewhat standardized', 'SAP API or GUI is accessible']
      },
      processCharacteristics: {
        isRuleBased: false,
        hasStandardInputs: false,
        systemCount: 2,
        dataType: 'Unstructured',
        processComplexity: 'High',
        autonomyLevel: 3,
        requiresHumanJudgment: true,
        hasApiAccess: false
      },
      businessCase: {
        implementationCost: 50000,
        annualSavings: 120000,
        roiPercentage: 140,
        paybackPeriodMonths: 5,
        npv: 250000,
        fteReduction: 2.5,
        timelineWeeks: 8,
        effortStoryPoints: 55
      },
      discovery: {
        asIsSteps: ['Receive email', 'Download PDF', 'Read PDF', 'Enter into SAP', 'Save'],
        businessRules: ['Invoice amount > $1000 requires approval'],
        exceptions: ['Missing PO number', 'Illegible PDF'],
        processVariants: ['Domestic', 'International'],
        systems: ['Outlook', 'SAP ECC'],
        integrations: ['Email', 'SAP GUI'],
        inputs: ['PDF Invoices'],
        outputs: ['SAP Records'],
        sla: '24 hours',
        dataVolume: '10,000 / month',
        peakPeriods: 'Month-end',
        complianceRequirements: 'SOX'
      },
      prd: {
        executiveSummary: 'Automate the extraction and entry of invoice data to reduce manual effort.',
        userPersonas: ['AP Clerk', 'Finance Manager'],
        functionalRequirements: ['Extract text from PDF', 'Validate PO', 'Enter data in SAP'],
        nonFunctionalRequirements: ['99% accuracy', 'Process < 1 min per invoice'],
        acceptanceCriteria: ['Successfully processes 100 sample invoices without error'],
        outOfScope: ['Purchase Order generation'],
        dependencies: ['SAP environment access']
      },
      solution: {
        toBeSummary: 'An Intelligent Document Processing pipeline extracting data and an RPA bot entering it into SAP.',
        architectureSummary: 'Cloud OCR -> Queue -> RPA Bot -> SAP',
        recommendedTechnology: 'Azure Form Recognizer + UiPath',
        components: ['OCR Engine', 'UiPath Orchestrator', 'SAP BAPI']
      },
      podAllocation: {
        podName: 'Intelligent Automation Pod Alpha',
        skillsMatched: ['OCR', 'UiPath', 'SAP'],
        allocationPercentage: 100,
        startDate: '2026-07-01',
        endDate: '2026-08-30'
      },
      sprintReadiness: {
        status: 'Ready',
        readinessScore: 95,
        targetSprintDate: '2026-07-01',
        gates: [
          { name: 'PRD Approved', description: 'Product requirements are finalized', passed: true },
          { name: 'Architecture Approved', description: 'Solution design signed off', passed: true }
        ],
        blockers: []
      },
      backlogItems: [
        { jiraKey: 'INV-001', title: 'Setup OCR Engine', type: 'Task', priority: 'High', storyPoints: 5, status: 'To Do', assignee: 'Alice', sprint: 'Sprint 1' },
        { jiraKey: 'INV-002', title: 'Build SAP integration', type: 'Story', priority: 'High', storyPoints: 8, status: 'To Do', assignee: 'Bob', sprint: 'Sprint 1' }
      ],
      complianceChecks: [
        { name: 'Security Review', status: 'Passed', details: 'No sensitive data exposed', checkedBy: 'SecOps', checkedDate: '2026-06-20' }
      ],
      auditTrail: [
        { id: '1', timestamp: new Date().toISOString(), action: 'Opportunity Created', performedBy: 'Jane Doe', role: 'Business User', details: 'Initial submission', stage: 'Intake' }
      ]
    },
    {
      id: 'OPP-002',
      processName: 'Employee Onboarding Provisioning',
      description: 'Automate AD account creation, software assignment, and email welcome.',
      businessUnit: 'HR',
      submitter: 'John Smith',
      currentStage: 'Scoring',
      pipelineStatus: 'Active',
      classification: {
        recommendedType: 'Power Automate/Power Platform',
        confidenceScore: 88,
        reasoning: 'Standardized IT process with clear APIs (Azure AD, Office 365).',
        matchScores: { 'RPA': 60, 'Intelligent Automation': 20, 'Hyperautomation/Agentic Automation': 30, 'Power Automate/Power Platform': 88 },
        alternatives: [],
        assumptions: ['Workday or HRIS API is available']
      },
      processCharacteristics: {
        isRuleBased: true,
        hasStandardInputs: true,
        systemCount: 3,
        dataType: 'Structured',
        processComplexity: 'Medium',
        autonomyLevel: 4,
        requiresHumanJudgment: false,
        hasApiAccess: true
      },
      businessCase: null,
      discovery: null,
      prd: null,
      solution: null,
      podAllocation: null,
      sprintReadiness: null,
      backlogItems: [],
      complianceChecks: [],
      auditTrail: []
    },
    {
      id: 'OPP-003',
      processName: 'Customer Support Triaging',
      description: 'Use GenAI to read incoming support tickets, classify them, and route them to the correct department.',
      businessUnit: 'Customer Success',
      submitter: 'Sarah Connor',
      currentStage: 'Intake',
      pipelineStatus: 'Active',
      classification: {
        recommendedType: 'Hyperautomation/Agentic Automation',
        confidenceScore: 85,
        reasoning: 'Requires natural language understanding and dynamic decision making for routing.',
        matchScores: { 'RPA': 10, 'Intelligent Automation': 70, 'Hyperautomation/Agentic Automation': 85, 'Power Automate/Power Platform': 40 },
        alternatives: [],
        assumptions: ['Zendesk/Salesforce integration']
      },
      processCharacteristics: {
        isRuleBased: false,
        hasStandardInputs: false,
        systemCount: 2,
        dataType: 'Unstructured',
        processComplexity: 'High',
        autonomyLevel: 5,
        requiresHumanJudgment: false,
        hasApiAccess: true
      },
      businessCase: null,
      discovery: null,
      prd: null,
      solution: null,
      podAllocation: null,
      sprintReadiness: null,
      backlogItems: [],
      complianceChecks: [],
      auditTrail: []
    }
  ];

  for (const opp of opps) {
    // Check if exists
    const existing = await prisma.opportunity.findUnique({ where: { id: opp.id } });
    if (!existing) {
      await prisma.opportunity.create({
        data: {
          id: opp.id,
          processName: opp.processName,
          currentStage: opp.currentStage,
          status: opp.pipelineStatus,
          data: JSON.stringify(opp)
        }
      });
      console.log(`Created opportunity ${opp.id}`);
    } else {
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: {
          processName: opp.processName,
          currentStage: opp.currentStage,
          status: opp.pipelineStatus,
          data: JSON.stringify(opp)
        }
      });
      console.log(`Updated opportunity ${opp.id}`);
    }
  }

  console.log('Seeding complete.');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
