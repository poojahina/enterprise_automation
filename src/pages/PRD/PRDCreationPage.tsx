import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { FileSignature, Users, CheckCircle, AlertTriangle, Layers, ListTodo, Sparkles } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ProgressStepper from '../../components/shared/ProgressStepper';

const PRDCreationPage: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities.find(o => o.prd)?.id ?? opportunities[0]?.id ?? '');
  const opp = opportunities.find(o => o.id === selectedId);

  const [generating, setGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  const generatePRD = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Generate requirements', provider: 'AzureOpenAI' })
      });
      const data = await res.json();
      setAiOutput(data.result);
    } catch (error) {
      console.error('Generation failed', error);
    } finally {
      setGenerating(false);
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
              <button className="mt-3 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30">
                Apply to PRD Form
              </button>
            </div>
          )}
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
          <p className="text-sm text-gray-400">PRD not yet created. Complete discovery first.</p>
        </AnimatedCard>
      )}
    </div>
  );
};

export default PRDCreationPage;
