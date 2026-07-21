import React, { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Layers, AlertTriangle, Database, ArrowRight, Upload, Sparkles, Check } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { getNextStageRoute } from '../../utils/pipeline';
import { apiFetch } from '../../utils/api';

const DiscoveryWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId } = useStore();
  const [selectedId, setSelectedId] = useState<string>(
    selectedOpportunityId ??
    opportunities.find(o => o.currentStage === 'Discovery' || o.currentStage === 'Scored')?.id ??
    opportunities.find(o => o.discovery)?.id ??
    opportunities[0]?.id ??
    ''
  );
  const opp = opportunities.find(o => o.id === selectedId);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  useEffect(() => {
    if (opportunities.length > 0 && !opportunities.some((o) => o.id === selectedId)) {
      setSelectedId(opportunities[0].id);
    }
  }, [opportunities, selectedId]);

  useEffect(() => {
    if (selectedId) setSelectedOpportunityId(selectedId);
  }, [selectedId, setSelectedOpportunityId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !opp) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('opportunityId', opp.id);

    try {
      const res = await apiFetch('/api/context/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Context uploaded and parsed successfully!');
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  const generateDiscovery = async () => {
    if (!opp) return;
    setGenerating(true);
    setMessage('');
    try {
      const res = await apiFetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate process steps for ${opp.processName}`, provider: 'AzureOpenAI', context: opp })
      });
      if (!res.ok) throw new Error('Failed to generate discovery draft.');
      const data = await res.json();
      setAiOutput(data.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const applyDiscovery = async (goNext = false) => {
    if (!opp) return;
    setApplying(true);
    setMessage('');
    try {
      await useStore.getState().runWorkflowAction(opp.id, 'apply-discovery', { aiOutput });
      setAiOutput(null);
      if (goNext) {
        navigate(getNextStageRoute('Discovery'));
      } else {
        setMessage('Discovery workspace applied.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to apply discovery.');
    } finally {
      setApplying(false);
    }
  };

  const Section: React.FC<{ title: string; icon: React.ReactNode; items: string[] }> = ({ title, icon, items }) => (
    <AnimatedCard>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-blue-400">{icon}</div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">{items.length}</span>
      </div>
      <ol className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-[10px] font-mono text-gray-500 mt-0.5 w-4">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </AnimatedCard>
  );

  return (
    <div className="space-y-6 animate-fade-in" id="discovery-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
          <Search className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">L2 Discovery Workspace</h1>
          <p className="max-w-3xl text-sm text-gray-300">
            Deep-dives requirement - context, variants, exceptions, remove ambiguity add techno functional details
          </p>
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
        <AnimatedCard className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => opp.discovery ? navigate(getNextStageRoute('Discovery')) : applyDiscovery(true)}
                disabled={applying}
                className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {applying ? 'Completing...' : opp.discovery ? 'Continue to PDD' : 'Complete Discovery'}
              </button>
              {opp.discovery && (
                <button
                  onClick={() => navigate(getNextStageRoute('Discovery'))}
                  disabled={applying}
                  className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Go to Next Stage
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-4">Upload process documentation (video transcripts, SOPs, PDFs) to automatically extract Discovery requirements.</p>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors text-sm text-gray-300">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Context Document'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            
            <button
              onClick={generateDiscovery}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating...' : 'Auto-Generate Discovery'}
            </button>
          </div>

          {aiOutput && (
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-purple-500/20">
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Generated Draft</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiOutput}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button onClick={() => applyDiscovery(false)} disabled={applying} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 disabled:opacity-50">
                  {applying ? 'Applying...' : 'Apply to Discovery Workspace'}
                </button>
                <button onClick={() => applyDiscovery(true)} disabled={applying} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30 disabled:opacity-50">
                  {applying ? 'Completing...' : 'Apply and Continue'}
                </button>
              </div>
            </div>
          )}
          {message && <p className="mt-3 text-sm text-blue-300">{message}</p>}
        </AnimatedCard>
      )}

      {opp?.discovery ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="As-Is Process Steps" icon={<Layers className="w-4 h-4" />} items={opp.discovery.asIsSteps} />
          <Section title="Business Rules" icon={<FileText className="w-4 h-4" />} items={opp.discovery.businessRules} />
          <Section title="Exceptions & Edge Cases" icon={<AlertTriangle className="w-4 h-4" />} items={opp.discovery.exceptions} />
          <Section title="Process Variants" icon={<ArrowRight className="w-4 h-4" />} items={opp.discovery.processVariants} />
          <Section title="Systems & Applications" icon={<Database className="w-4 h-4" />} items={opp.discovery.systems} />
          <Section title="Integrations" icon={<ArrowRight className="w-4 h-4" />} items={opp.discovery.integrations} />

          <AnimatedCard className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Additional Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase">SLA</p><p className="text-xs text-gray-200 mt-1">{opp.discovery.sla}</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase">Data Volume</p><p className="text-xs text-gray-200 mt-1">{opp.discovery.dataVolume}</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase">Peak Periods</p><p className="text-xs text-gray-200 mt-1">{opp.discovery.peakPeriods}</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase">Compliance</p><p className="text-xs text-gray-200 mt-1">{opp.discovery.complianceRequirements}</p></div>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <h3 className="text-sm font-semibold text-white mb-2">Inputs</h3>
            <div className="flex flex-wrap gap-1.5">
              {opp.discovery.inputs.map((inp, i) => (
                <span key={i} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">{inp}</span>
              ))}
            </div>
          </AnimatedCard>
          <AnimatedCard>
            <h3 className="text-sm font-semibold text-white mb-2">Outputs</h3>
            <div className="flex flex-wrap gap-1.5">
              {opp.discovery.outputs.map((out, i) => (
                <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full">{out}</span>
              ))}
            </div>
          </AnimatedCard>
        </div>
      ) : (
        <AnimatedCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-400">Discovery not yet completed. Generate it with AI, or complete discovery using the default workspace.</p>
            {opp && (
              <button
                onClick={() => applyDiscovery(true)}
                disabled={applying}
                className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {applying ? 'Completing...' : 'Complete Discovery'}
              </button>
            )}
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default DiscoveryWorkspace;
