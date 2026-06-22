import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { CheckSquare, Check, X, AlertTriangle } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ScoreGauge from '../../components/shared/ScoreGauge';
import Badge from '../../components/shared/Badge';
import ExplainabilityPanel from '../../components/shared/ExplainabilityPanel';
import ProgressStepper from '../../components/shared/ProgressStepper';

const QualificationPage: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities[0]?.id ?? '');
  const opp = opportunities.find(o => o.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in" id="qualification-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
          <CheckSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">L1 Qualification</h1>
          <p className="text-sm text-gray-400">Validate minimum thresholds for volume, impact, data, and compliance</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && (
        <>
          <ProgressStepper currentStage={opp.currentStage} />

          {opp.qualification ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <AnimatedCard>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Qualification Status</p>
                      <Badge variant="status" value={opp.qualification.status} size="md" />
                    </div>
                    <ScoreGauge score={opp.qualification.overallScore} label="Score" size="sm" />
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{opp.qualification.recommendation}</p>

                  {/* Qualification Checks */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Qualification Checks</h3>
                    {opp.qualification.checks.map((check, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                        check.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                      }`}>
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${
                          check.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {check.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-200">{check.name}</p>
                            <span className="text-[10px] text-gray-500">Weight: {check.weight}%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{check.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {opp.qualification.missingInfo.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <p className="text-sm font-semibold text-amber-400">Missing Information</p>
                      </div>
                      <ul className="space-y-1">
                        {opp.qualification.missingInfo.map((info, i) => (
                          <li key={i} className="text-xs text-amber-300 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-amber-400 rounded-full" />{info}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-4">
                    <button className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-500/30 transition-colors">
                      Request More Info
                    </button>
                    <button className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </AnimatedCard>

                <ExplainabilityPanel
                  title="Qualification Logic"
                  reasoning={opp.qualification.recommendation}
                  details={{
                    'Overall Score': `${opp.qualification.overallScore}/100`,
                    'Checks Passed': `${opp.qualification.checks.filter(c => c.passed).length}/${opp.qualification.checks.length}`,
                    'Missing Items': String(opp.qualification.missingInfo.length),
                  }}
                />
              </div>

              <div className="space-y-3">
                <AnimatedCard>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Opportunity Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Process</span><span className="text-gray-200 font-medium">{opp.processName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Unit</span><span className="text-gray-200">{opp.businessUnit}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Volume</span><span className="text-gray-200">{opp.metrics.volumePerMonth.toLocaleString()}/mo</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Effort</span><span className="text-gray-200">{opp.metrics.manualEffortHours}h/mo</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Cost Savings</span><span className="text-emerald-400 font-medium">${opp.impact.costSavingsPerMonth.toLocaleString()}/mo</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Error Rate</span><span className="text-gray-200">{opp.metrics.errorRatePercent}%</span></div>
                  </div>
                </AnimatedCard>
              </div>
            </div>
          ) : (
            <AnimatedCard>
              <p className="text-sm text-gray-400">Qualification not yet performed for this opportunity. Complete classification first.</p>
            </AnimatedCard>
          )}
        </>
      )}
    </div>
  );
};

export default QualificationPage;
