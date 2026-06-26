import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { Users, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import Badge from '../../components/shared/Badge';
import ScoreGauge from '../../components/shared/ScoreGauge';
import { getAllPods } from '../../utils/recommendPod';
import type { AutomationType } from '../../models/types';

const TYPE_COLORS: Record<AutomationType, string> = {
  'Hyperautomation/Agentic Automation': '#a78bfa',
  'RPA': '#60a5fa',
  'Intelligent Automation': '#22d3ee',
  'Power Automate/Power Platform': '#fbbf24',
};

const PodAllocationPage: React.FC = () => {
  const { opportunities } = useStore();
  const pods = getAllPods();
  const [selectedId, setSelectedId] = useState<string>(opportunities.find(o => !o.podAllocation)?.id ?? opportunities[0]?.id ?? '');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const selectedOpp = opportunities.find(o => o.id === selectedId);

  const generateRecommendation = async () => {
    if (!selectedOpp) return;
    setGenerating(true);
    setMessage('');
    try {
      await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Generate team', provider: 'AzureOpenAI', context: selectedOpp })
      });
      const updated = await useStore.getState().runWorkflowAction(selectedOpp.id, 'allocate-pod');
      setMessage(`Recommended and assigned ${updated.podAllocation?.podName ?? 'delivery pod'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate pod recommendation.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="pod-allocation-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Pod Allocation</h1>
          <p className="text-sm text-gray-400">Delivery pod assignment based on skills, capacity, and specialization</p>
        </div>
      </div>

      <AnimatedCard className="border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-blue-500/5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">AI Team Composition Generator</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Dynamically analyze project requirements to recommend optimal pod allocation and skill combinations.</p>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs font-medium text-gray-400">Opportunity:</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
            {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} - {o.processName}</option>)}
          </select>
        </div>
        <button
          disabled={!selectedOpp || generating}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          onClick={generateRecommendation}
        >
          <Sparkles className="w-4 h-4" /> {generating ? 'Assigning...' : 'Generate & Assign Recommendation'}
        </button>
        {message && <p className="mt-3 text-sm text-blue-300">{message}</p>}
      </AnimatedCard>

      {/* Pod Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pods.map((pod, i) => {
          const assigned = opportunities.filter(o => o.podAllocation?.podName === pod.podName);
          return (
            <AnimatedCard key={pod.podName} delay={i * 100}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[pod.specialization] }} />
                    <h3 className="text-sm font-bold text-white">{pod.podName}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 ml-5">Lead: {pod.podLead} • {pod.teamSize} members</p>
                </div>
                <ScoreGauge score={pod.currentCapacity} label="Capacity" size="sm" color={pod.currentCapacity > 50 ? '#34d399' : pod.currentCapacity > 20 ? '#fbbf24' : '#f87171'} />
              </div>

              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Specialization</p>
                <Badge variant="automation" value={pod.specialization} size="md" />
              </div>

              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {pod.skills.map(skill => (
                    <span key={skill} className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-white/10">
                <span className="flex items-center gap-1">
                  {pod.deliveryRisk === 'Low' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  Risk: {pod.deliveryRisk}
                </span>
                <span>Assigned: {assigned.length} opportunities</span>
              </div>

              {assigned.length > 0 && (
                <div className="mt-3 space-y-1">
                  {assigned.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-gray-300">{a.id} — {a.processName.slice(0, 25)}</span>
                      <Badge variant="stage" value={a.currentStage} />
                    </div>
                  ))}
                </div>
              )}
            </AnimatedCard>
          );
        })}
      </div>
    </div>
  );
};

export default PodAllocationPage;
