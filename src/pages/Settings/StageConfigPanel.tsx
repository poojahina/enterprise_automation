import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { useStore } from '../../state/store';

interface Stage {
  id: string;
  name: string;
  order: number;
  isEnabled: boolean;
}

const StageConfigPanel: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const globalStages = useStore(state => state.stages);
  const fetchGlobalStages = useStore(state => state.fetchStages);
  const saveStages = useStore(state => state.saveStages);

  useEffect(() => {
    fetchGlobalStages()
      .catch((error) => {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : 'Failed to fetch stage configuration.');
      })
      .finally(() => setLoading(false));
  }, [fetchGlobalStages]);

  useEffect(() => {
    if (!saving) setStages(globalStages);
  }, [globalStages, saving]);

  const toggleStage = (id: string) => {
    if (stages.find(stage => stage.id === id)?.name === 'A2B Readiness Check') return;
    setMessage('');
    setStages(prev => prev.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setIsError(false);
    try {
      await saveStages(stages);
      setMessage('Stage configuration saved successfully. The pipeline will now skip disabled stages.');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading Configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="settings-page">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Settings className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Stage Configuration</h1>
          <p className="text-sm text-gray-400">Dynamically enable or disable pipeline stages. Disabled stages will be bypassed automatically.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Order</th>
              <th className="px-6 py-4 font-medium">Stage Name</th>
              <th className="px-6 py-4 font-medium text-right">Status (Enabled)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {stages.map((stage) => (
              <tr key={stage.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-gray-400">{stage.order}</td>
                <td className="px-6 py-4 font-medium text-gray-200">{stage.name}</td>
                <td className="px-6 py-4 text-right">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      aria-label={`${stage.isEnabled ? 'Disable' : 'Enable'} ${stage.name}`}
                      checked={stage.isEnabled}
                      disabled={saving || stage.name === 'A2B Readiness Check'}
                      onChange={() => toggleStage(stage.id)}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                  {stage.name === 'A2B Readiness Check' && <span className="ml-2 text-[10px] text-amber-300">Mandatory</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg border ${isError ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default StageConfigPanel;
