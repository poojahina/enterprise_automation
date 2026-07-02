import React, { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Users, CheckCircle, AlertTriangle, Layers, ListTodo, Sparkles, ArrowRight } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { getNextStageRoute } from '../../utils/pipeline';

const PRDCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId } = useStore();
  const [selectedId, setSelectedId] = useState<string>(
    selectedOpportunityId ??
    opportunities.find(o => o.currentStage === 'PDD Creation' || o.currentStage === 'Discovery')?.id ??
    opportunities.find(o => o.prd)?.id ??
    opportunities[0]?.id ??
    ''
  );
  const opp = opportunities.find(o => o.id === selectedId);

  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  useEffect(() => {
    if (opportunities.length > 0 && !opportunities.some((o) => o.id === selectedId)) {
      setSelectedId(opportunities[0].id);
    }
  }, [opportunities, selectedId]);

  useEffect(() => {
    if (selectedId) setSelectedOpportunityId(selectedId);
  }, [selectedId, setSelectedOpportunityId]);

  const generatePRD = async () => {
    if (!opp) return;
    setGenerating(true);
    setMessage('');
    try {
      const res = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate requirements for ${opp.processName}`, provider: 'AzureOpenAI', context: opp })
      });
      if (!res.ok) throw new Error('Failed to generate PRD draft.');
      const data = await res.json();
      setAiOutput(data.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const applyPRD = async (goNext = false) => {
    if (!opp) return;
    setApplying(true);
    setMessage('');
    try {
      await useStore.getState().runWorkflowAction(opp.id, 'apply-prd', { aiOutput });
      setAiOutput(null);
      if (goNext) {
        navigate(getNextStageRoute('PDD Creation'));
      } else {
        setMessage('PRD applied.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to apply PRD.');
    } finally {
      setApplying(false);
    }
  };

  const regenerateDetailedPRD = async () => {
    if (!opp) return;
    setApplying(true);
    setMessage('');
    try {
      await useStore.getState().runWorkflowAction(opp.id, 'apply-prd');
      setAiOutput(null);
      setMessage('Detailed PRD regenerated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to regenerate PRD.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="prd-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
          <FileSignature className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Product Requirements Document (PRD)</h1>
          <p className="text-sm text-gray-400">Detailed requirements and acceptance criteria for the solution</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

      {/* AI Assistant Panel */}
      {opp && (
        <AnimatedCard className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-rose-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {opp.prd && (
                <button
                  onClick={regenerateDetailedPRD}
                  disabled={applying}
                  className="flex items-center gap-1.5 bg-pink-500/20 text-pink-300 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-pink-500/30 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {applying ? 'Regenerating...' : 'Regenerate Detailed PRD'}
                </button>
              )}
              <button
                onClick={() => opp.prd ? navigate(getNextStageRoute('PDD Creation')) : applyPRD(true)}
                disabled={applying}
                className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {applying ? 'Completing...' : opp.prd ? 'Continue to Solution' : 'Complete PRD'}
              </button>
              {opp.prd && (
                <button
                  onClick={() => navigate(getNextStageRoute('PDD Creation'))}
                  disabled={applying}
                  className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Go to Next Stage
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-4">Leverage Discovery Context to automatically generate comprehensive Product Requirements.</p>
          
          <button
            onClick={generatePRD}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Drafting PRD...' : 'Auto-Generate PRD'}
          </button>

          {aiOutput && (
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-pink-500/20">
              <h4 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">Generated Draft</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiOutput}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button onClick={() => applyPRD(false)} disabled={applying} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 disabled:opacity-50">
                  {applying ? 'Applying...' : 'Apply to PRD Form'}
                </button>
                <button onClick={() => applyPRD(true)} disabled={applying} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30 disabled:opacity-50">
                  {applying ? 'Completing...' : 'Apply and Continue'}
                </button>
              </div>
            </div>
          )}
          {message && <p className="mt-3 text-sm text-blue-300">{message}</p>}
        </AnimatedCard>
      )}

      {opp?.prd ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatedCard className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3"><FileSignature className="w-4 h-4 text-pink-400" /><h3 className="text-sm font-semibold text-white">Executive Summary</h3></div>
            <p className="text-sm text-gray-300 leading-relaxed">{opp.prd.executiveSummary}</p>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-cyan-400" /><h3 className="text-sm font-semibold text-white">User Personas</h3></div>
            <div className="flex flex-wrap gap-2">
              {opp.prd.userPersonas.map((p, i) => (
                <span key={i} className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><ListTodo className="w-4 h-4 text-blue-400" /><h3 className="text-sm font-semibold text-white">Functional Requirements</h3></div>
            <ul className="space-y-1.5">
              {opp.prd.functionalRequirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 mt-1.5" />{r}
                </li>
              ))}
            </ul>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-purple-400" /><h3 className="text-sm font-semibold text-white">Non-Functional Requirements</h3></div>
            <ul className="space-y-1.5">
              {opp.prd.nonFunctionalRequirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0 mt-1.5" />{r}
                </li>
              ))}
            </ul>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-semibold text-white">Acceptance Criteria</h3></div>
            <ul className="space-y-1.5">
              {opp.prd.acceptanceCriteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500/60 mt-0.5 flex-shrink-0" />{c}
                </li>
              ))}
            </ul>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-amber-400" /><h3 className="text-sm font-semibold text-white">Out of Scope & Dependencies</h3></div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Out of Scope</p>
                <ul className="space-y-1">
                  {opp.prd.outOfScope.map((item, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Dependencies</p>
                <div className="flex flex-wrap gap-1.5">
                  {opp.prd.dependencies.map((dep, i) => (
                    <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">{dep}</span>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>
      ) : (
        <AnimatedCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-400">PRD not yet created. Generate a draft, or create a detailed PRD from the discovery context.</p>
            {opp && (
              <button
                onClick={() => applyPRD(true)}
                disabled={applying}
                className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {applying ? 'Completing...' : 'Complete PRD'}
              </button>
            )}
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default PRDCreationPage;
