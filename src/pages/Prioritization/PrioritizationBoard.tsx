import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { Kanban, ArrowUpDown } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import AnimatedCard from '../../components/shared/AnimatedCard';
import Badge from '../../components/shared/Badge';

const PrioritizationBoard: React.FC = () => {
  const { opportunities } = useStore();
  const [sortBy, setSortBy] = useState<'score' | 'roi' | 'complexity'>('score');
  const [filterType, setFilterType] = useState<string>('All');

  const types = ['All', ...new Set(opportunities.filter(o => o.classification).map(o => o.classification!.recommendedType))];

  const filtered = opportunities.filter(o => {
    if (filterType === 'All') return true;
    return o.classification?.recommendedType === filterType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0);
    if (sortBy === 'roi') return (b.businessCase?.roiPercentage ?? 0) - (a.businessCase?.roiPercentage ?? 0);
    const cMap: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };
    return (cMap[a.score?.complexity ?? 'M'] ?? 3) - (cMap[b.score?.complexity ?? 'M'] ?? 3);
  });

  // Bubble chart: Impact (x) vs Feasibility (y) vs ROI (size)
  const bubbleData = opportunities
    .filter(o => o.score && o.businessCase)
    .map(o => ({
      x: o.score!.dimensions.businessImpact,
      y: o.score!.dimensions.feasibility,
      z: Math.max(10, o.businessCase!.roiPercentage / 2),
      name: o.processName.slice(0, 20),
      id: o.id,
    }));

  return (
    <div className="space-y-6 animate-fade-in" id="prioritization-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
          <Kanban className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Prioritization Board</h1>
          <p className="text-sm text-gray-400">Rank, filter, and compare all automation opportunities</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Sort By:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500/50">
            <option value="score">Score</option><option value="roi">ROI</option><option value="complexity">Complexity</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Type:</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500/50">
            {types.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
          </select>
        </div>
      </div>

      {/* Bubble Chart */}
      {bubbleData.length > 0 && (
        <AnimatedCard>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Impact vs Feasibility (bubble size = ROI)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" name="Business Impact" tick={{ fill: '#9ca3af', fontSize: 10 }} label={{ value: 'Business Impact', position: 'insideBottom', offset: -3, fill: '#6b7280', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="Feasibility" tick={{ fill: '#9ca3af', fontSize: 10 }} label={{ value: 'Feasibility', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
              <ZAxis type="number" dataKey="z" range={[100, 800]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220,25%,15%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: 12 }} />
              <Scatter data={bubbleData} fill="#60a5fa" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </AnimatedCard>
      )}

      {/* Prioritized Table */}
      <AnimatedCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">#</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">ID</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">Process</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">Type</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">Stage</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase flex items-center gap-1 cursor-pointer" onClick={() => setSortBy('score')}><ArrowUpDown className="w-3 h-3" />Score</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">Complexity</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">Priority</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase">ROI</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((opp, i) => (
                <tr key={opp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-blue-400">{opp.id}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-200 max-w-[180px] truncate">{opp.processName}</td>
                  <td className="px-3 py-2.5">{opp.classification && <Badge variant="automation" value={opp.classification.recommendedType} />}</td>
                  <td className="px-3 py-2.5"><Badge variant="stage" value={opp.currentStage} /></td>
                  <td className="px-3 py-2.5 text-sm font-bold text-white">{opp.score?.totalScore ?? '—'}</td>
                  <td className="px-3 py-2.5">{opp.score && <Badge variant="complexity" value={opp.score.complexity} />}</td>
                  <td className="px-3 py-2.5">{opp.score && <Badge variant="priority" value={opp.score.priorityBand} />}</td>
                  <td className="px-3 py-2.5 text-sm font-medium text-emerald-400">{opp.businessCase ? `${opp.businessCase.roiPercentage}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedCard>
    </div>
  );
};

export default PrioritizationBoard;
