import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { Rocket, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import Badge from '../../components/shared/Badge';
import ScoreGauge from '../../components/shared/ScoreGauge';
import StatusBadge from '../../components/shared/StatusBadge';
import ProgressStepper from '../../components/shared/ProgressStepper';

const SprintReadinessPage: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities.find(o => o.sprintReadiness)?.id ?? opportunities[0]?.id ?? '');
  const opp = opportunities.find(o => o.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in" id="sprint-readiness-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
          <Rocket className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Sprint Readiness Assessment</h1>
          <p className="text-sm text-gray-400">Gate-based readiness certification and blocker identification</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

      {opp?.sprintReadiness ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <AnimatedCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sprint Readiness Status</p>
                  <Badge variant="status" value={opp.sprintReadiness.status} size="md" />
                  {opp.sprintReadiness.targetSprintDate && (
                    <p className="text-xs text-gray-400 mt-1">Target Sprint: {opp.sprintReadiness.targetSprintDate}</p>
                  )}
                </div>
                <ScoreGauge score={opp.sprintReadiness.readinessScore} label="Ready" size="md" />
              </div>

              {/* Gates */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Readiness Gates</h3>
                {opp.sprintReadiness.gates.map((gate, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    gate.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${
                      gate.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {gate.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{gate.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{gate.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {opp.sprintReadiness.blockers.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-semibold text-red-400">Blockers</p>
                  </div>
                  <ul className="space-y-1">
                    {opp.sprintReadiness.blockers.map((b, i) => (
                      <li key={i} className="text-xs text-red-300 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-red-400 rounded-full" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AnimatedCard>

            {/* Jira Backlog Preview */}
            {opp.backlogItems.length > 0 && (
              <AnimatedCard delay={100}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    Jira Backlog Preview
                  </h3>
                  <span className="text-[10px] text-gray-400">{opp.backlogItems.reduce((s, b) => s + b.storyPoints, 0)} total story points</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">Key</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">Title</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">Type</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">Priority</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">SP</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">Status</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-400">Sprint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opp.backlogItems.map(item => (
                        <tr key={item.jiraKey} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-3 py-2 text-xs font-mono text-blue-400">{item.jiraKey}</td>
                          <td className="px-3 py-2 text-xs text-gray-200 max-w-[160px] truncate">{item.title}</td>
                          <td className="px-3 py-2"><span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">{item.type}</span></td>
                          <td className="px-3 py-2"><Badge variant="priority" value={item.priority} /></td>
                          <td className="px-3 py-2 text-xs font-bold text-gray-200">{item.storyPoints}</td>
                          <td className="px-3 py-2"><StatusBadge status={item.status} pulse={item.status === 'In Progress'} /></td>
                          <td className="px-3 py-2 text-[10px] text-gray-400">{item.sprint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnimatedCard>
            )}
          </div>

          {/* Compliance & Audit */}
          <div className="space-y-3">
            {opp.complianceChecks.length > 0 && (
              <AnimatedCard>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compliance Checks</h3>
                <div className="space-y-2">
                  {opp.complianceChecks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                      <StatusBadge status={check.status} size="sm" />
                      <div>
                        <p className="text-xs font-medium text-gray-200">{check.name}</p>
                        <p className="text-[10px] text-gray-400">{check.details}</p>
                        {check.checkedDate && <p className="text-[9px] text-gray-500 mt-0.5">{check.checkedBy} — {check.checkedDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedCard>
            )}

            {opp.auditTrail.length > 0 && (
              <AnimatedCard>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Audit Trail</h3>
                <div className="space-y-3">
                  {opp.auditTrail.map((entry, i) => (
                    <div key={entry.id} className="relative pl-4 border-l-2 border-white/10 pb-3 last:pb-0">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                      <p className="text-xs font-medium text-gray-200">{entry.action}</p>
                      <p className="text-[10px] text-gray-400">{entry.details}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">{entry.performedBy} ({entry.role}) — {new Date(entry.timestamp).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </AnimatedCard>
            )}
          </div>
        </div>
      ) : (
        <AnimatedCard>
          <p className="text-sm text-gray-400">Sprint readiness assessment not yet performed. Complete all prior pipeline stages first.</p>
        </AnimatedCard>
      )}
    </div>
  );
};

export default SprintReadinessPage;
