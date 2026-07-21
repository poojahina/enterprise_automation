import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, FileSignature, RefreshCw, Sparkles } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { useStore } from '../../state/store';
import { getNextStageRoute } from '../../utils/pipeline';
import type { ProcessDefinitionDocument } from '../../models/types';
import { apiFetch } from '../../utils/api';

const sectionLabels: { key: keyof ProcessDefinitionDocument; title: string }[] = [
  { key: 'processOverview', title: '1. Process Overview' },
  { key: 'currentStateSteps', title: '2. Current-State Process (As-Is)' },
  { key: 'systems', title: '3. Systems and Applications' },
  { key: 'inputsAndOutputs', title: '4. Inputs and Outputs' },
  { key: 'businessRules', title: '5. Business Rules' },
  { key: 'exceptions', title: '6. Exceptions' },
  { key: 'humanApprovals', title: '7. Human Decisions and Approvals' },
  { key: 'painPointsAndBaseline', title: '8. Pain Points and Baseline' },
  { key: 'targetProcess', title: '9. Target Process (To-Be)' },
  { key: 'controls', title: '10. Controls, SLA, and Compliance' },
  { key: 'openItems', title: '11. Assumptions and Open Items' },
];

const PDDCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId } = useStore();
  const [selectedId, setSelectedId] = useState(selectedOpportunityId ?? opportunities.find(o => o.pdd)?.id ?? opportunities[0]?.id ?? '');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const opp = opportunities.find(o => o.id === selectedId);

  useEffect(() => {
    if (opportunities.length && !opportunities.some(o => o.id === selectedId)) setSelectedId(opportunities[0].id);
  }, [opportunities, selectedId]);

  useEffect(() => {
    if (selectedId) setSelectedOpportunityId(selectedId);
  }, [selectedId, setSelectedOpportunityId]);

  const generate = async (goNext = false) => {
    if (!opp) return;
    setGenerating(true);
    setMessage('');
    try {
      await useStore.getState().runWorkflowAction(opp.id, 'apply-pdd');
      setMessage('PDD generated and saved.');
      if (goNext) navigate(getNextStageRoute('PDD Creation'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate PDD.');
    } finally {
      setGenerating(false);
    }
  };

  const exportPdd = async () => {
    if (!opp) return;
    setExporting(true);
    try {
      const response = await apiFetch(`/api/documents/${opp.id}/pdd/export`);
      if (!response.ok) throw new Error('PDD export failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${opp.id}-pdd.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'PDD export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="pdd-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
          <FileSignature className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Process Definition Document (PDD)</h1>
          <p className="max-w-3xl text-sm text-gray-300">
            Extracts requirements, rules and process flow, auto generates PDD to KPMG standards, flag gaps for human review before sign off
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Opportunity:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} - {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

      {opp && (
        <AnimatedCard className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-rose-500/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-pink-400" /><h3 className="text-sm font-semibold text-white">PDD Generator</h3></div>
              <p className="text-xs text-gray-400 mt-1">Uses the saved discovery assessment and opportunity context.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => generate(false)} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm disabled:opacity-50">
                {opp.pdd ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating PDD...' : opp.pdd ? 'Regenerate PDD' : 'Generate PDD'}
              </button>
              <button onClick={exportPdd} disabled={!opp.pdd || exporting} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm disabled:opacity-40">
                <Download className="w-4 h-4" />{exporting ? 'Exporting...' : 'Export PDD'}
              </button>
              <button onClick={() => opp.pdd ? navigate(getNextStageRoute('PDD Creation')) : generate(true)} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm disabled:opacity-50">
                <CheckCircle className="w-4 h-4" />Continue to A2B
              </button>
            </div>
          </div>
          {message && <p className="mt-3 text-sm text-blue-300">{message}</p>}
        </AnimatedCard>
      )}

      {opp?.pdd ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sectionLabels.map(({ key, title }, index) => (
            <AnimatedCard key={key} className={index === 0 || key === 'targetProcess' ? 'lg:col-span-2' : ''}>
              <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
              <ul className="space-y-2">
                {opp.pdd?.[key].map((line, lineIndex) => (
                  <li key={lineIndex} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full flex-shrink-0 mt-2" />{line}
                  </li>
                ))}
              </ul>
            </AnimatedCard>
          ))}
        </div>
      ) : (
        <AnimatedCard><p className="text-sm text-gray-400 text-center py-6">Generate the PDD after Discovery to create and save the process definition.</p></AnimatedCard>
      )}
    </div>
  );
};

export default PDDCreationPage;
