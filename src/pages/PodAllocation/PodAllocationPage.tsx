import React from 'react';
import { useStore } from '../../state/store';
import { Users, CheckCircle2, AlertTriangle } from 'lucide-react';
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
