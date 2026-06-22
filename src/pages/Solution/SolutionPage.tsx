import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { Lightbulb, Cpu, Shield, Monitor, Users, Puzzle } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import Badge from '../../components/shared/Badge';
import ProgressStepper from '../../components/shared/ProgressStepper';

const SolutionPage: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities.find(o => o.solution)?.id ?? opportunities[0]?.id ?? '');
  const opp = opportunities.find(o => o.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in" id="solution-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Solution Recommendation</h1>
          <p className="text-sm text-gray-400">Architecture, technology stack, and implementation design</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

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
          <p className="text-sm text-gray-400">Solution design not yet completed. Complete discovery first.</p>
        </AnimatedCard>
      )}
    </div>
  );
};

export default SolutionPage;
