import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { ChevronRight, ChevronLeft, Check, Send } from 'lucide-react';
import { classifyAutomationType } from '../../utils/classifyAutomationType';
import AnimatedCard from '../../components/shared/AnimatedCard';
import type { AutomationOpportunity, ProcessCharacteristics } from '../../models/types';

const STEPS = ['Basic Info', 'Process Characteristics', 'Impact & Metrics', 'Review & Submit'];

const IntakeWizard: React.FC = () => {
  const navigate = useNavigate();
  const { addOpportunity } = useStore();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    processName: '', description: '', businessUnit: '', processOwner: '',
    isRuleBased: false, requiresReasoning: false, requiresMultiSystemOrchestration: false,
    usesGenAI: false, requiresDocumentUnderstanding: false, isWorkflowAutomation: false,
    hasAPIAvailability: false, requiresHumanInTheLoop: false, autonomyLevel: 3,
    dataType: 'Structured' as ProcessCharacteristics['dataType'],
    processComplexity: 'Medium' as ProcessCharacteristics['processComplexity'],
    painPoints: '', timeSavings: 40, costSavings: 3000,
    volumePerMonth: 500, manualEffortHours: 60, errorRate: 5, usersImpacted: 10,
    applications: '', dataSources: '',
    businessPriority: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    targetTimeline: 'Q4 2026',
  });

  const updateForm = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    const chars: ProcessCharacteristics = {
      isRuleBased: form.isRuleBased, requiresReasoning: form.requiresReasoning,
      requiresMultiSystemOrchestration: form.requiresMultiSystemOrchestration,
      usesGenAI: form.usesGenAI, requiresDocumentUnderstanding: form.requiresDocumentUnderstanding,
      isWorkflowAutomation: form.isWorkflowAutomation, hasAPIAvailability: form.hasAPIAvailability,
      requiresHumanInTheLoop: form.requiresHumanInTheLoop, autonomyLevel: form.autonomyLevel,
      dataType: form.dataType, processComplexity: form.processComplexity,
    };
    const classification = classifyAutomationType(chars);
    const newOpp: AutomationOpportunity = {
      id: `OPP-${String(Date.now()).slice(-3)}`,
      processName: form.processName, description: form.description,
      businessUnit: form.businessUnit, processOwner: form.processOwner,
      submittedBy: 'Ashutosh', submittedDate: new Date().toISOString().split('T')[0],
      currentStage: 'Classified',
      processCharacteristics: chars,
      impact: {
        painPoints: form.painPoints, timeSavingsHoursPerMonth: form.timeSavings,
        costSavingsPerMonth: form.costSavings, riskReduction: 'To be assessed',
        qualityImprovement: 'To be assessed', strategicAlignment: 'Medium',
      },
      technical: {
        applications: form.applications.split(',').map(s => s.trim()).filter(Boolean),
        dataSources: form.dataSources.split(',').map(s => s.trim()).filter(Boolean),
        dataType: form.dataType, currentAutomationLevel: 10,
      },
      metrics: {
        volumePerMonth: form.volumePerMonth, frequencyPerMonth: 22,
        manualEffortHours: form.manualEffortHours, errorRatePercent: form.errorRate,
        usersImpacted: form.usersImpacted, avgProcessingTimeMinutes: 10,
      },
      priority: {
        businessPriority: form.businessPriority, targetTimeline: form.targetTimeline,
        complianceImpact: 'Low', regulatoryRequirement: false,
      },
      classification, qualification: null, score: null, discovery: null,
      solution: null, businessCase: null, backlogItems: [],
      podAllocation: null, sprintReadiness: null, complianceChecks: [],
      auditTrail: [{
        id: `AT-${Date.now()}`, timestamp: new Date().toISOString(),
        action: 'Idea Submitted & Auto-Classified', performedBy: 'Ashutosh',
        role: 'Business User', details: `Classified as ${classification.recommendedType} (${classification.confidenceScore}%)`,
        stage: 'Classified',
      }],
    };
    addOpportunity(newOpp);
    navigate('/classification');
  };

  const Toggle: React.FC<{ label: string; description: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-white/20'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </label>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="intake-wizard-page">
      <div>
        <h1 className="text-xl font-bold text-white">Submit Automation Idea</h1>
        <p className="text-sm text-gray-400 mt-1">Capture process details to classify and qualify your automation opportunity</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i < step ? 'bg-emerald-500/20 text-emerald-400' : i === step ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatedCard>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Process Name *</label>
                <input value={form.processName} onChange={e => updateForm('processName', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="e.g., Invoice Processing" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Business Unit *</label>
                <input value={form.businessUnit} onChange={e => updateForm('businessUnit', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="e.g., Finance" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Process Owner</label>
                <input value={form.processOwner} onChange={e => updateForm('processOwner', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="e.g., Lisa Martinez" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Target Timeline</label>
                <select value={form.targetTimeline} onChange={e => updateForm('targetTimeline', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"><option>Q3 2026</option><option>Q4 2026</option><option>Q1 2027</option><option>Q2 2027</option></select></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="Describe the process and the problem..." /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Applications (comma-separated)</label>
                <input value={form.applications} onChange={e => updateForm('applications', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="e.g., SAP, SharePoint" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Data Sources (comma-separated)</label>
                <input value={form.dataSources} onChange={e => updateForm('dataSources', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="e.g., CRM Database, API" /></div>
            </div>
          </div>
        )}

        {/* Step 1: Process Characteristics */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">Process Characteristics</h2>
            <p className="text-xs text-gray-400">These attributes drive the automation type classification engine</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle label="Rule-Based" description="Process follows deterministic rules" checked={form.isRuleBased} onChange={v => updateForm('isRuleBased', v)} />
              <Toggle label="Requires Reasoning" description="Needs cognitive decision-making" checked={form.requiresReasoning} onChange={v => updateForm('requiresReasoning', v)} />
              <Toggle label="Multi-System Orchestration" description="Spans multiple enterprise systems" checked={form.requiresMultiSystemOrchestration} onChange={v => updateForm('requiresMultiSystemOrchestration', v)} />
              <Toggle label="Uses GenAI" description="Leverages generative AI capabilities" checked={form.usesGenAI} onChange={v => updateForm('usesGenAI', v)} />
              <Toggle label="Document Understanding" description="Requires OCR/document AI" checked={form.requiresDocumentUnderstanding} onChange={v => updateForm('requiresDocumentUnderstanding', v)} />
              <Toggle label="Workflow Automation" description="Primarily a workflow/approval process" checked={form.isWorkflowAutomation} onChange={v => updateForm('isWorkflowAutomation', v)} />
              <Toggle label="API Availability" description="Target systems expose APIs" checked={form.hasAPIAvailability} onChange={v => updateForm('hasAPIAvailability', v)} />
              <Toggle label="Human-in-the-Loop" description="Requires human review/approval" checked={form.requiresHumanInTheLoop} onChange={v => updateForm('requiresHumanInTheLoop', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Autonomy Level: {form.autonomyLevel}/5</label>
                <input type="range" min="1" max="5" value={form.autonomyLevel} onChange={e => updateForm('autonomyLevel', parseInt(e.target.value))} className="w-full accent-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Data Type</label>
                <select value={form.dataType} onChange={e => updateForm('dataType', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"><option>Structured</option><option>Semi-Structured</option><option>Unstructured</option></select></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Process Complexity</label>
                <select value={form.processComplexity} onChange={e => updateForm('processComplexity', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"><option>Low</option><option>Medium</option><option>High</option></select></div>
            </div>
          </div>
        )}

        {/* Step 2: Impact & Metrics */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">Impact & Metrics</h2>
            <div><label className="block text-xs font-medium text-gray-400 mb-1">Pain Points</label>
              <textarea value={form.painPoints} onChange={e => updateForm('painPoints', e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" placeholder="Describe current challenges..." /></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Time Savings (hrs/mo)</label>
                <input type="number" value={form.timeSavings} onChange={e => updateForm('timeSavings', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Cost Savings ($/mo)</label>
                <input type="number" value={form.costSavings} onChange={e => updateForm('costSavings', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Volume (per month)</label>
                <input type="number" value={form.volumePerMonth} onChange={e => updateForm('volumePerMonth', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Manual Effort (hrs/mo)</label>
                <input type="number" value={form.manualEffortHours} onChange={e => updateForm('manualEffortHours', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Error Rate (%)</label>
                <input type="number" value={form.errorRate} onChange={e => updateForm('errorRate', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Users Impacted</label>
                <input type="number" value={form.usersImpacted} onChange={e => updateForm('usersImpacted', parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" /></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1">Business Priority</label>
              <select value={form.businessPriority} onChange={e => updateForm('businessPriority', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">Review & Submit</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Process Name</p><p className="text-gray-200 font-medium">{form.processName || '—'}</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Business Unit</p><p className="text-gray-200 font-medium">{form.businessUnit || '—'}</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Autonomy Level</p><p className="text-gray-200 font-medium">{form.autonomyLevel}/5</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Data Type</p><p className="text-gray-200 font-medium">{form.dataType}</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Time Savings</p><p className="text-gray-200 font-medium">{form.timeSavings} hrs/mo</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Cost Savings</p><p className="text-gray-200 font-medium">${form.costSavings.toLocaleString()}/mo</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Volume</p><p className="text-gray-200 font-medium">{form.volumePerMonth.toLocaleString()}/mo</p></div>
              <div className="bg-white/5 rounded-lg px-4 py-3"><p className="text-xs text-gray-400">Priority</p><p className="text-gray-200 font-medium">{form.businessPriority}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.isRuleBased && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Rule-Based</span>}
              {form.requiresReasoning && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Reasoning</span>}
              {form.requiresMultiSystemOrchestration && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Multi-System</span>}
              {form.usesGenAI && <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">GenAI</span>}
              {form.requiresDocumentUnderstanding && <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Document AI</span>}
              {form.isWorkflowAutomation && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Workflow</span>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all"
            >
              <Send className="w-4 h-4" /> Submit & Classify
            </button>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
};

export default IntakeWizard;
