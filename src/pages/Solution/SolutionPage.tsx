import React, { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Cpu, Shield, Monitor, Users, Puzzle, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { getNextStageRoute } from '../../utils/pipeline';

const SolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId } = useStore();
  const [selectedId, setSelectedId] = useState<string>(
    selectedOpportunityId ??
    opportunities.find(o => o.currentStage === 'SDD Creation' || o.currentStage === 'PDD Creation')?.id ??
    opportunities.find(o => o.solution)?.id ??
    opportunities[0]?.id ??
    ''
  );
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const opp = opportunities.find(o => o.id === selectedId);

  useEffect(() => {
    if (opportunities.length > 0 && !opportunities.some((o) => o.id === selectedId)) {
      setSelectedId(opportunities[0].id);
    }
  }, [opportunities, selectedId]);

  useEffect(() => {
    if (selectedId) setSelectedOpportunityId(selectedId);
  }, [selectedId, setSelectedOpportunityId]);

  const generateSolution = async (goNext = false) => {
    if (!opp) return;
    setGenerating(true);
    setMessage('');
    try {
      setSelectedOpportunityId(opp.id);
      await useStore.getState().runWorkflowAction(opp.id, 'generate-solution');
      if (goNext) {
        navigate(getNextStageRoute('SDD Creation'));
      } else {
        setMessage('Solution recommendation generated.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate solution.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="solution-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Solution Design Document (SDD)</h1>
          <p className="text-sm text-gray-400">Create the architecture, integrations, security, monitoring, and implementation design</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

      {opp && (
        <AnimatedCard className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">SDD Generator</h3>
              </div>
              <p className="text-xs text-gray-400 mt-1">Generate architecture, components, integrations, security, and monitoring recommendations.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button onClick={() => generateSolution(false)} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm">
                <Sparkles className="w-4 h-4" />
                {generating ? 'Generating SDD...' : opp.solution ? 'Regenerate SDD' : 'Generate SDD'}
              </button>
              <button
                onClick={() => opp.solution ? navigate(getNextStageRoute('SDD Creation')) : generateSolution(true)}
                disabled={generating}
                className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {generating ? 'Completing...' : opp.solution ? 'Continue to ROI' : 'Generate and Continue'}
              </button>
              {opp.solution && (
                <button
                  onClick={() => navigate(getNextStageRoute('SDD Creation'))}
                  disabled={generating}
                  className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Go to Next Stage
                </button>
              )}
            </div>
          </div>
          {message && <p className="mt-3 text-sm text-blue-300">{message}</p>}
        </AnimatedCard>
      )}

      {opp?.solution ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatedCard className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-2">To-Be Solution Summary</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{opp.solution.toBeSummary}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="bg-white/5 rounded-lg px-3 py-2"><p className="text-[10px] text-gray-400">Technology</p><p className="text-xs text-blue-400 font-medium">{opp.solution.recommendedTechnology}</p></div>
              <div className="bg-white/5 rounded-lg px-3 py-2"><p className="text-[10px] text-gray-400">Effort</p><p className="text-xs text-gray-200 font-medium">{opp.solution.estimatedEffort}</p></div>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Cpu className="w-4 h-4 text-blue-400" /><h3 className="text-sm font-semibold text-white">Architecture</h3></div>
            <p className="text-sm text-gray-300 leading-relaxed">{opp.solution.architectureSummary}</p>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Puzzle className="w-4 h-4 text-purple-400" /><h3 className="text-sm font-semibold text-white">Components</h3></div>
            <div className="space-y-1.5">
              {opp.solution.components.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />{c}
                </div>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-cyan-400" /><h3 className="text-sm font-semibold text-white">Human-in-the-Loop</h3></div>
            <p className="text-sm text-gray-300 leading-relaxed">{opp.solution.humanInLoopDesign}</p>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-semibold text-white">Security & Monitoring</h3></div>
            <p className="text-sm text-gray-300 leading-relaxed mb-2">{opp.solution.securityConsiderations}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{opp.solution.monitoringStrategy}</p>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-2 mb-3"><Monitor className="w-4 h-4 text-amber-400" /><h3 className="text-sm font-semibold text-white">Integrations</h3></div>
            <div className="flex flex-wrap gap-1.5">
              {opp.solution.integrations.map((intg, i) => (
                <span key={i} className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">{intg}</span>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <h3 className="text-sm font-semibold text-white mb-2">Scalability</h3>
            <p className="text-sm text-gray-300">{opp.solution.scalabilityNotes}</p>
          </AnimatedCard>
        </div>
      ) : (
        <AnimatedCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-400">SDD not yet completed. Generate the technical solution design to move into ROI.</p>
            {opp && (
              <button
                onClick={() => generateSolution(true)}
                disabled={generating}
                className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {generating ? 'Generating...' : 'Generate and Continue'}
              </button>
            )}
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default SolutionPage;
