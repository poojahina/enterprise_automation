import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { Workflow, Sparkles, ArrowRight, Check, X } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import Badge from '../../components/shared/Badge';
import ScoreGauge from '../../components/shared/ScoreGauge';
import ExplainabilityPanel from '../../components/shared/ExplainabilityPanel';
import ProgressStepper from '../../components/shared/ProgressStepper';
import type { AutomationType, AutomationOpportunity } from '../../models/types';
import { getNextStageRoute } from '../../utils/pipeline';

const TYPE_COLORS: Record<AutomationType, string> = {
  'Hyperautomation/Agentic Automation': '#a78bfa',
  'RPA': '#60a5fa',
  'Intelligent Automation': '#22d3ee',
  'Power Automate/Power Platform': '#fbbf24',
};

const TYPE_DESCRIPTIONS: Record<AutomationType, string> = {
  'Hyperautomation/Agentic Automation': 'Multi-system orchestration with AI-driven reasoning, autonomous decision-making, and GenAI capabilities. Suitable for complex, high-autonomy processes.',
  'RPA': 'Robotic Process Automation for rule-based, repetitive tasks with structured data. Ideal for deterministic processes with low complexity.',
  'Intelligent Automation': 'AI/ML-enhanced automation with document understanding, NLP, and cognitive capabilities. Best for semi-structured/unstructured data processing.',
  'Power Automate/Power Platform': 'Low-code workflow automation using Microsoft Power Platform. Perfect for API-driven workflows with simple business logic.',
};

const ClassificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const opp = opportunities.find(o => o.id === selectedId);

  useEffect(() => {
    if (opportunities.length > 0 && !opportunities.some((o) => o.id === selectedId)) {
      setSelectedId(opportunities[0].id);
    }
  }, [opportunities, selectedId]);

  const handleAccept = async () => {
    if (!opp) return;
    const nextStage = getNextStageRoute('Classification');
    setSaving(true);
    setSaveError('');

    try {
      await useStore.getState().runWorkflowAction(opp.id, 'accept-classification');
      navigate(nextStage);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to accept classification.');
    } finally {
      setSaving(false);
    }
  };

  const handleOverride = async () => {
    if (!opp) return;
    const requestedType = window.prompt(
      'Override classification type',
      opp.classification?.alternatives[0]?.type ?? opp.classification?.recommendedType ?? 'RPA'
    );

    if (!requestedType) return;

    setSaving(true);
    setSaveError('');

    try {
      await useStore.getState().runWorkflowAction(opp.id, 'override-classification', {
        recommendedType: requestedType,
        reasoning: 'Classification manually overridden from the Classification workspace.',
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to override classification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="classification-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Classify Automation Solution Type</h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">Mandatory first step — AI-driven classification into Hyperautomation, RPA, Intelligent Automation, or Power Platform</p>
        </div>
      </div>

      {/* Opportunity Selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Select Opportunity:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          id="opportunity-selector"
        >
          {opportunities.map(o => (
            <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>
          ))}
        </select>
      </div>

      {opp && opp.classification && (
        <>
          {/* Pipeline Progress */}
          <ProgressStepper currentStage={opp.currentStage} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Classification Result - Main Card */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatedCard>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Recommended Classification</p>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5" style={{ color: TYPE_COLORS[opp.classification.recommendedType] }} />
                      {opp.classification.recommendedType}
                    </h2>
                  </div>
                  <ScoreGauge score={opp.classification.confidenceScore} label="Confidence" size="sm" color={TYPE_COLORS[opp.classification.recommendedType]} />
                </div>

                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  {TYPE_DESCRIPTIONS[opp.classification.recommendedType]}
                </p>

                {/* Process Characteristics */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Process Characteristics</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(opp.processCharacteristics).map(([key, value]) => {
                      if (typeof value === 'boolean') {
                        return (
                          <span key={key} className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
                            value ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-500 border-white/10'
                          }`}>
                            {value ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                          </span>
                        );
                      }
                      return null;
                    })}
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Autonomy: {opp.processCharacteristics.autonomyLevel}/5
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {opp.processCharacteristics.dataType}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                      {opp.processCharacteristics.processComplexity} Complexity
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button onClick={handleAccept} disabled={saving} className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> {saving ? 'Accepting...' : 'Accept Classification'}
                  </button>
                  <button onClick={handleOverride} disabled={saving} className="flex items-center gap-1.5 bg-white/5 text-gray-300 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50">
                    Override
                  </button>
                </div>
                {saveError && (
                  <p className="mt-3 text-sm text-red-400">{saveError}</p>
                )}
              </AnimatedCard>

              {/* Explainability */}
              <ExplainabilityPanel
                title="Classification Reasoning"
                reasoning={opp.classification.reasoning}
                assumptions={opp.classification.assumptions}
                details={{
                  'Confidence Score': `${opp.classification.confidenceScore}%`,
                  'Data Type': opp.processCharacteristics.dataType,
                  'Autonomy Level': `${opp.processCharacteristics.autonomyLevel}/5`,
                  'Complexity': opp.processCharacteristics.processComplexity,
                }}
                defaultOpen
              />
            </div>

            {/* Type Comparison Panel */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Type Match Scores</h3>
              {Object.entries(opp.classification.matchScores)
                .sort(([, a], [, b]) => b - a)
                .map(([type, score]) => {
                  const isRecommended = type === opp.classification!.recommendedType;
                  return (
                    <AnimatedCard
                      key={type}
                      className={isRecommended ? 'border-blue-500/30 bg-blue-500/5' : ''}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type as AutomationType] }} />
                          <p className="text-xs font-semibold text-gray-200">{type.split('/')[0]}</p>
                        </div>
                        {isRecommended && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">RECOMMENDED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${score}%`, backgroundColor: TYPE_COLORS[type as AutomationType] }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-300 w-8 text-right">{score}%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                        {TYPE_DESCRIPTIONS[type as AutomationType]?.slice(0, 80)}...
                      </p>
                    </AnimatedCard>
                  );
                })}

              {/* Alternatives */}
              {opp.classification.alternatives.length > 0 && (
                <AnimatedCard>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Alternative Recommendations</h4>
                  {opp.classification.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
                      <ArrowRight className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-200 font-medium">{alt.type}</p>
                        <p className="text-[10px] text-gray-400">{alt.reason}</p>
                      </div>
                    </div>
                  ))}
                </AnimatedCard>
              )}
            </div>
          </div>
        </>
      )}

      {opp && !opp.classification && (
        <AnimatedCard>
          <p className="text-sm text-gray-400">No classification data available for this opportunity. Submit through the intake wizard to auto-classify.</p>
        </AnimatedCard>
      )}
    </div>
  );
};

export default ClassificationPage;
