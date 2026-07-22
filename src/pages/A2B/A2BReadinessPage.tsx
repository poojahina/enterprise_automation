import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Bot, CheckCircle, ClipboardCheck, Play, Send, ShieldCheck, User } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { useStore } from '../../state/store';
import type { A2BDecision, A2BResult } from '../../models/types';
import { apiFetch } from '../../utils/api';

interface A2BPayload {
  run: { id: string; status: A2BDecision; overallScore: number } | null;
  results: A2BResult[];
}

interface ChatMessage {
  id: number;
  role: 'agent' | 'user';
  content: string;
}

const buildAgentPrompts = [
  'Help me decide the reusable assets or libraries',
  'Help me resolve the following error:',
];

const A2BReadinessPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId, fetchOpportunities, role } = useStore();
  const [selectedId, setSelectedId] = useState(projectId ?? selectedOpportunityId ?? opportunities[0]?.id ?? '');
  const [payload, setPayload] = useState<A2BPayload>({ run: null, results: [] });
  const [sddEnabled, setSddEnabled] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'agent', content: 'How can I help you prepare this automation for build?' },
  ]);
  const [chatting, setChatting] = useState(false);
  const opp = opportunities.find(o => o.id === selectedId);

  const load = useCallback(async () => {
    if (!selectedId) return;
    const [resultsResponse, statusResponse] = await Promise.all([
      apiFetch(`/api/projects/${selectedId}/a2b/results`),
      apiFetch(`/api/projects/${selectedId}/a2b/status`)
    ]);
    if (!resultsResponse.ok || !statusResponse.ok) throw new Error('Unable to load A2B.');
    setPayload(await resultsResponse.json());
    setSddEnabled(Boolean((await statusResponse.json()).sddEnabled));
  }, [selectedId]);

  useEffect(() => { load().catch(error => setMessage(error.message)); }, [load]);
  useEffect(() => { if (selectedId) setSelectedOpportunityId(selectedId); }, [selectedId, setSelectedOpportunityId]);

  const counts = useMemo(() => payload.results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1; return acc;
  }, {}), [payload.results]);

  const runCheck = async () => {
    setRunning(true); setMessage('');
    try {
      const response = await apiFetch(`/api/projects/${selectedId}/a2b/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ executedBy: 'Current User' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? data.error ?? 'A2B check failed.');
      await load();
      await fetchOpportunities();
      setMessage(`A2B completed: ${data.status}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'A2B check failed.'); }
    finally { setRunning(false); }
  };

  const override = async () => {
    const reason = window.prompt('Provide the business reason for overriding A2B:');
    if (!reason) return;
    const response = await apiFetch(`/api/projects/${selectedId}/a2b/override`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizedBy: 'Current User', role, reason })
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? 'Override failed.'); return; }
    await load(); setMessage('Authorized override recorded in the audit trail.');
  };

  const sendBuildAgentMessage = async () => {
    const prompt = chatInput.trim();
    if (!prompt || !opp || chatting) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: prompt };
    setChatMessages(current => [...current, userMessage]);
    setChatInput('');
    setChatting(true);

    try {
      const response = await apiFetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Act as the Build Agent for automation ${opp.id} (${opp.processName}). ${prompt}`,
          provider: 'AzureOpenAI',
          context: opp,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Build Agent could not respond.');
      setChatMessages(current => [...current, { id: Date.now() + 1, role: 'agent', content: data.result }]);
    } catch (error) {
      setChatMessages(current => [...current, {
        id: Date.now() + 1,
        role: 'agent',
        content: error instanceof Error ? error.message : 'Build Agent could not respond.',
      }]);
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="a2b-readiness-page">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600"><ClipboardCheck className="h-4 w-4 text-white" /></div>
        <div><h1 className="text-xl font-bold text-white">A2B — Analysis-to-Build</h1><p className="text-sm text-gray-400">Validate analysis evidence before solution design begins</p></div>
      </div>
      <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200">
        {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
      </select>
      {opp && <ProgressStepper currentStage={opp.currentStage} />}
      <AnimatedCard className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
              <Bot className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Build Agent</h2>
              <p className="text-xs text-gray-400">Get build guidance for the selected automation</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
            Automation ID
            <select
              value={selectedId}
              onChange={event => setSelectedId(event.target.value)}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-cyan-500/50 focus:outline-none"
            >
              {opportunities.map(o => <option key={o.id} value={o.id}>{o.id} — {o.processName}</option>)}
            </select>
          </label>
        </div>

        <div className="my-4 max-h-72 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {chatMessages.map(chatMessage => (
            <div key={chatMessage.id} className={`flex gap-2 ${chatMessage.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {chatMessage.role === 'agent' && <Bot className="mt-2 h-4 w-4 flex-shrink-0 text-cyan-300" />}
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                chatMessage.role === 'user' ? 'bg-blue-500 text-white' : 'border border-white/10 bg-white/5 text-gray-200'
              }`}>
                {chatMessage.content}
              </div>
              {chatMessage.role === 'user' && <User className="mt-2 h-4 w-4 flex-shrink-0 text-blue-300" />}
            </div>
          ))}
          {chatting && <p className="pl-6 text-xs text-cyan-300">Build Agent is thinking...</p>}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {buildAgentPrompts.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => setChatInput(prompt)}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-left text-xs text-cyan-200 transition-colors hover:bg-cyan-500/20"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <textarea
            value={chatInput}
            onChange={event => setChatInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendBuildAgentMessage();
              }
            }}
            rows={2}
            placeholder="Ask the Build Agent a question..."
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void sendBuildAgentMessage()}
            disabled={!chatInput.trim() || !opp || chatting}
            className="flex items-center gap-2 self-end rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </AnimatedCard>
      <div className="grid gap-3 md:grid-cols-6">
        <AnimatedCard><p className="text-xs text-gray-400">Decision</p><p className="mt-1 font-bold text-white">{payload.run?.status ?? 'NOT_RUN'}</p></AnimatedCard>
        <AnimatedCard><p className="text-xs text-gray-400">Score</p><p className="mt-1 font-bold text-white">{payload.run?.overallScore ?? 0}%</p></AnimatedCard>
        {['passed','failed','partial','not_applicable'].map(status => <AnimatedCard key={status}><p className="text-xs capitalize text-gray-400">{status.replace('_', ' ')}</p><p className="mt-1 font-bold text-white">{counts[status] ?? 0}</p></AnimatedCard>)}
      </div>
      <AnimatedCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-white">A2B controls</h2><p className="text-xs text-gray-400">Every active database criterion is evaluated against the PDD and uploaded project documents.</p></div>
          <div className="flex gap-2">
            <button onClick={runCheck} disabled={running || !selectedId} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-50"><Play className="h-4 w-4" />{running ? 'Running...' : 'Run A2B Check'}</button>
            <button onClick={override} disabled={!selectedId || sddEnabled || !['Product Owner', 'Solution Architect', 'Automation COE Analyst'].includes(role)} className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm text-amber-300 disabled:opacity-40"><ShieldCheck className="h-4 w-4" />Authorized Override</button>
            <button onClick={() => navigate('/sdd')} disabled={!sddEnabled} className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 disabled:opacity-40"><CheckCircle className="h-4 w-4" />Continue to SDD</button>
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-blue-300">{message}</p>}
      </AnimatedCard>
      <AnimatedCard className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-white/10 text-gray-400"><tr>{['Criterion','Severity','Status','Confidence','Evidence','Missing information','Recommendation'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{payload.results.map(result => <tr key={result.id} className="border-b border-white/5 align-top">
            <td className="p-3 font-medium text-white">{result.criterionName}<div className="text-[10px] text-gray-500">{result.category}</div></td>
            <td className="p-3 text-gray-300">{result.severity}</td>
            <td className="p-3">{result.status === 'passed' ? <span className="text-emerald-400">passed</span> : <span className="flex items-center gap-1 text-amber-300"><AlertTriangle className="h-3 w-3" />{result.status}</span>}</td>
            <td className="p-3 text-gray-300">{result.confidenceScore}%</td><td className="p-3 text-gray-300">{result.evidenceFound || '—'}{result.sourceLocation && <div className="text-[10px] text-blue-300">{result.sourceLocation}</div>}</td>
            <td className="p-3 text-gray-300">{result.missingInformation || '—'}</td><td className="p-3 text-gray-300">{result.recommendation}</td>
          </tr>)}</tbody>
        </table>
        {!payload.results.length && <p className="py-8 text-center text-sm text-gray-400">Run A2B to generate readiness results.</p>}
      </AnimatedCard>
    </div>
  );
};

export default A2BReadinessPage;
