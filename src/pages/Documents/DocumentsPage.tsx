import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { FileText, Download, Printer, Share2 } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import Badge from '../../components/shared/Badge';

type DocType = 'prd' | 'business-case' | 'solution-design' | 'sprint-backlog';

const DocumentsPage: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities[0]?.id ?? '');
  const [activeDoc, setActiveDoc] = useState<DocType>('business-case');
  const [syncing, setSyncing] = useState(false);
  const opp = opportunities.find(o => o.id === selectedId);

  const syncToSharePoint = async () => {
    if (!opp) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/integrations/sharepoint/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opp.id, documentId: activeDoc })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert('Sync failed');
      }
    } catch (error) {
      alert('Error syncing to SharePoint');
    } finally {
      setSyncing(false);
    }
  };

  const docs: { type: DocType; title: string; available: boolean }[] = [
    { type: 'prd', title: 'Product Requirements Document', available: !!opp?.prd },
    { type: 'business-case', title: 'Business Case Document', available: !!opp?.businessCase },
    { type: 'solution-design', title: 'Solution Design Document', available: !!opp?.solution },
    { type: 'sprint-backlog', title: 'Sprint Backlog Export', available: (opp?.backlogItems.length ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="documents-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Document Generation</h1>
          <p className="text-sm text-gray-400">Preview and export business case, solution design, and backlog documents</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Opportunity:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {/* Doc Type Tabs */}
      <div className="flex gap-2">
        {docs.map(doc => (
          <button
            key={doc.type}
            onClick={() => setActiveDoc(doc.type)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeDoc === doc.type ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            } ${!doc.available ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={!doc.available}
          >
            {doc.title}
          </button>
        ))}
      </div>

      {/* Document Preview */}
      <AnimatedCard className="max-w-4xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <h2 className="text-base font-bold text-white">{docs.find(d => d.type === activeDoc)?.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={syncToSharePoint}
              disabled={syncing}
              className="flex items-center gap-1 bg-white/5 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Share2 className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse text-blue-400' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to SharePoint'}
            </button>
            <button className="flex items-center gap-1 bg-white/5 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>

        {activeDoc === 'prd' && opp?.prd && (
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">1. Executive Summary</h3>
              <p className="text-gray-300">{opp.prd.executiveSummary}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">2. Functional Requirements</h3>
              <ul className="space-y-1">{opp.prd.functionalRequirements.map((r, i) => <li key={i} className="text-gray-300 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />{r}</li>)}</ul>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">3. Acceptance Criteria</h3>
              <ul className="space-y-1">{opp.prd.acceptanceCriteria.map((c, i) => <li key={i} className="text-gray-300 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />{c}</li>)}</ul>
            </div>
          </div>
        )}

        {activeDoc === 'business-case' && opp?.businessCase && (
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">1. Executive Summary</h3>
              <p className="text-gray-300">{opp.description}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">2. Financial Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><p className="text-[10px] text-gray-400">Implementation Cost</p><p className="text-lg font-bold text-gray-200">${opp.businessCase.implementationCost.toLocaleString()}</p></div>
                <div><p className="text-[10px] text-gray-400">Annual Savings</p><p className="text-lg font-bold text-emerald-400">${opp.businessCase.annualSavings.toLocaleString()}</p></div>
                <div><p className="text-[10px] text-gray-400">ROI</p><p className="text-lg font-bold text-blue-400">{opp.businessCase.roiPercentage}%</p></div>
                <div><p className="text-[10px] text-gray-400">Payback Period</p><p className="text-lg font-bold text-gray-200">{opp.businessCase.paybackPeriodMonths} months</p></div>
                <div><p className="text-[10px] text-gray-400">NPV (3yr)</p><p className="text-lg font-bold text-purple-400">${opp.businessCase.npv.toLocaleString()}</p></div>
                <div><p className="text-[10px] text-gray-400">FTE Reduction</p><p className="text-lg font-bold text-gray-200">{opp.businessCase.fteReduction}</p></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">3. Timeline & Effort</h3>
              <p className="text-gray-300">{opp.businessCase.timelineWeeks} weeks • {opp.businessCase.effortStoryPoints} story points</p>
            </div>
          </div>
        )}

        {activeDoc === 'solution-design' && opp?.solution && (
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">1. Solution Overview</h3>
              <p className="text-gray-300">{opp.solution.toBeSummary}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">2. Technology Stack</h3>
              <p className="text-blue-400 font-medium">{opp.solution.recommendedTechnology}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">3. Architecture</h3>
              <p className="text-gray-300">{opp.solution.architectureSummary}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-200 mb-2">4. Components</h3>
              <ul className="space-y-1">{opp.solution.components.map((c, i) => <li key={i} className="text-gray-300 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />{c}</li>)}</ul>
            </div>
          </div>
        )}

        {activeDoc === 'sprint-backlog' && opp && opp.backlogItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">Key</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">Title</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">Type</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">Priority</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">SP</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">Assignee</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-400">Sprint</th>
                </tr>
              </thead>
              <tbody>
                {opp.backlogItems.map(item => (
                  <tr key={item.jiraKey} className="border-b border-white/5">
                    <td className="px-3 py-2 text-xs font-mono text-blue-400">{item.jiraKey}</td>
                    <td className="px-3 py-2 text-xs text-gray-200">{item.title}</td>
                    <td className="px-3 py-2"><span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">{item.type}</span></td>
                    <td className="px-3 py-2"><Badge variant="priority" value={item.priority} /></td>
                    <td className="px-3 py-2 text-xs font-bold text-gray-200">{item.storyPoints}</td>
                    <td className="px-3 py-2 text-xs text-gray-300">{item.assignee}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{item.sprint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!docs.find(d => d.type === activeDoc)?.available && (
          <p className="text-sm text-gray-400 py-8 text-center">This document is not yet available. Complete the required pipeline stages first.</p>
        )}
      </AnimatedCard>
    </div>
  );
};

export default DocumentsPage;
