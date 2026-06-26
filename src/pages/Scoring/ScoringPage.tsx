import React, { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, Sparkles } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ScoreGauge from '../../components/shared/ScoreGauge';
import Badge from '../../components/shared/Badge';
import ExplainabilityPanel from '../../components/shared/ExplainabilityPanel';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { getNextStageRoute } from '../../utils/pipeline';

const ScoringPage: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId } = useStore();
  const [selectedId, setSelectedId] = useState<string>(selectedOpportunityId ?? opportunities[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
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

  const approveScoring = async () => {
    if (!opp) return;
    setSaving(true);
    setMessage('');
    try {
      setSelectedOpportunityId(opp.id);
      await useStore.getState().runWorkflowAction(opp.id, 'generate-score');
      navigate(getNextStageRoute('Scoring'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to approve scoring.');
    } finally {
      setSaving(false);
    }
  };

  const radarData = opp?.score ? [
    { subject: 'Business Impact', value: opp.score.dimensions.businessImpact },
    { subject: 'Strategic Alignment', value: opp.score.dimensions.strategicAlignment },
    { subject: 'Feasibility', value: opp.score.dimensions.feasibility },
    { subject: 'ROI Potential', value: opp.score.dimensions.roiPotential },
  ] : [];

  // Ranking table data
  const rankedOpps = opportunities
    .filter(o => o.score)
    .sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0));

  return (
    <div className="space-y-6 animate-fade-in" id="scoring-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI-Assisted Opportunity Scoring</h1>
          <p className="text-sm text-gray-400">Weighted scoring across business impact, strategy, feasibility, and ROI</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

      {opp?.score ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <AnimatedCard>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Priority Score</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="priority" value={opp.score.priorityBand} size="md" />
                    <Badge variant="complexity" value={opp.score.complexity} size="md" />
                  </div>
                </div>
                <ScoreGauge score={opp.score.totalScore} label="Score" size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-white/10">
                <button
                  onClick={approveScoring}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Approving...' : 'Approve for Discovery'}
                </button>
                <button
                  onClick={() => navigate(getNextStageRoute('Scoring'))}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Go to Next Stage
                </button>
              </div>
              {message && <p className="mb-4 text-sm text-red-400">{message}</p>}

              {/* Dimension Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Business Impact', value: opp.score.dimensions.businessImpact, weight: '30%', color: '#60a5fa' },
                  { label: 'Strategic Alignment', value: opp.score.dimensions.strategicAlignment, weight: '20%', color: '#a78bfa' },
                  { label: 'Feasibility', value: opp.score.dimensions.feasibility, weight: '25%', color: '#34d399' },
                  { label: 'ROI Potential', value: opp.score.dimensions.roiPotential, weight: '25%', color: '#fbbf24' },
                ].map(dim => (
                  <div key={dim.label} className="bg-white/5 rounded-lg p-3 text-center">
                    <ScoreGauge score={dim.value} label="" size="sm" color={dim.color} />
                    <p className="text-[10px] font-semibold text-gray-300 mt-1">{dim.label}</p>
                    <p className="text-[9px] text-gray-500">Weight: {dim.weight}</p>
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* Radar Chart */}
            <AnimatedCard delay={100}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Scoring Radar</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220,25%,15%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </AnimatedCard>

            <ExplainabilityPanel
              title="Scoring Methodology"
              reasoning={`Score of ${opp.score.totalScore}/100 places this opportunity in the ${opp.score.priorityBand} priority band with ${opp.score.complexity} complexity. Business impact driven by ${opp.impact.timeSavingsHoursPerMonth}h/month time savings and $${opp.impact.costSavingsPerMonth.toLocaleString()}/month cost savings.`}
              details={{
                'Priority Band': opp.score.priorityBand,
                'Complexity': opp.score.complexity,
                'Ranking': `#${opp.score.ranking || 'N/A'}`,
                'Automation Type': opp.score.recommendedAutomationType,
              }}
            />
          </div>

          {/* Comparative Ranking */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comparative Ranking</h3>
            {rankedOpps.map((r, i) => (
              <AnimatedCard key={r.id} className={r.id === selectedId ? 'border-blue-500/30' : ''} delay={i * 50}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : 'bg-white/10 text-gray-500'
                    }`}>{i + 1}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-200">{r.processName.slice(0, 25)}</p>
                      <p className="text-[10px] text-gray-500">{r.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{r.score!.totalScore}</p>
                    <Badge variant="priority" value={r.score!.priorityBand} />
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      ) : (
        <AnimatedCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-400">Scoring not yet performed. Complete qualification first or generate the score now.</p>
            {opp && (
              <button
                onClick={approveScoring}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {saving ? 'Generating...' : 'Generate Score'}
              </button>
            )}
          </div>
          {message && <p className="mt-3 text-sm text-red-400">{message}</p>}
        </AnimatedCard>
      )}
    </div>
  );
};

export default ScoringPage;
