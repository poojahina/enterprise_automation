import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { Calculator, DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AnimatedCard from '../../components/shared/AnimatedCard';
import ScoreGauge from '../../components/shared/ScoreGauge';
import ProgressStepper from '../../components/shared/ProgressStepper';
import { calculateROI } from '../../utils/calculateROI';

const ROICalculator: React.FC = () => {
  const { opportunities } = useStore();
  const [selectedId, setSelectedId] = useState<string>(opportunities.find(o => o.businessCase)?.id ?? opportunities[0]?.id ?? '');
  const opp = opportunities.find(o => o.id === selectedId);

  // Interactive sliders for what-if analysis
  const [implCost, setImplCost] = useState(opp?.businessCase?.implementationCost ?? 100000);
  const [annualSavings, setAnnualSavings] = useState(opp?.businessCase?.annualSavings ?? 150000);
  const [supportCost, setSupportCost] = useState(opp?.businessCase?.annualSupportCost ?? 20000);

  const liveROI = calculateROI({
    implementationCost: implCost, annualSavings, annualSupportCost: supportCost,
    timelineWeeks: opp?.businessCase?.timelineWeeks ?? 12,
    effortStoryPoints: opp?.businessCase?.effortStoryPoints ?? 80,
    fteReduction: opp?.businessCase?.fteReduction ?? 2,
  });

  // Chart data
  const costVsSavings = [
    { name: 'Implementation', cost: implCost, savings: 0 },
    { name: 'Year 1', cost: supportCost, savings: annualSavings },
    { name: 'Year 2', cost: supportCost, savings: annualSavings },
    { name: 'Year 3', cost: supportCost, savings: annualSavings },
  ];

  const cumulativeROI = Array.from({ length: 36 }, (_, i) => {
    const month = i + 1;
    const cumCost = implCost + (supportCost / 12) * month;
    const cumSavings = (annualSavings / 12) * month;
    return { month: `M${month}`, net: Math.round(cumSavings - cumCost) };
  }).filter((_, i) => i % 3 === 0);

  return (
    <div className="space-y-6 animate-fade-in" id="roi-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
          <Calculator className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">ROI Calculator</h1>
          <p className="text-sm text-gray-400">Interactive cost-benefit analysis with payback and NPV</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Select:</label>
        <select value={selectedId} onChange={e => { setSelectedId(e.target.value); const o = opportunities.find(x => x.id === e.target.value); if (o?.businessCase) { setImplCost(o.businessCase.implementationCost); setAnnualSavings(o.businessCase.annualSavings); setSupportCost(o.businessCase.annualSupportCost); } }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} — {o.processName}</option>)}
        </select>
      </div>

      {opp && <ProgressStepper currentStage={opp.currentStage} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sliders */}
        <AnimatedCard>
          <h3 className="text-sm font-semibold text-white mb-4">Adjust Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1"><span>Implementation Cost</span><span className="text-gray-200 font-medium">${implCost.toLocaleString()}</span></label>
              <input type="range" min="10000" max="500000" step="5000" value={implCost} onChange={e => setImplCost(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1"><span>Annual Savings</span><span className="text-emerald-400 font-medium">${annualSavings.toLocaleString()}</span></label>
              <input type="range" min="10000" max="500000" step="5000" value={annualSavings} onChange={e => setAnnualSavings(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1"><span>Annual Support Cost</span><span className="text-amber-400 font-medium">${supportCost.toLocaleString()}</span></label>
              <input type="range" min="0" max="100000" step="2000" value={supportCost} onChange={e => setSupportCost(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
          </div>
        </AnimatedCard>

        {/* KPI Summary */}
        <div className="space-y-3">
          <AnimatedCard delay={50}>
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] text-gray-400 uppercase">ROI</p><p className="text-2xl font-bold text-emerald-400">{liveROI.roiPercentage}%</p></div>
              <TrendingUp className="w-6 h-6 text-emerald-500/40" />
            </div>
          </AnimatedCard>
          <AnimatedCard delay={100}>
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] text-gray-400 uppercase">Payback Period</p><p className="text-2xl font-bold text-blue-400">{liveROI.paybackPeriodMonths}mo</p></div>
              <Clock className="w-6 h-6 text-blue-500/40" />
            </div>
          </AnimatedCard>
          <AnimatedCard delay={150}>
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] text-gray-400 uppercase">NPV (3yr)</p><p className="text-2xl font-bold text-purple-400">${liveROI.npv.toLocaleString()}</p></div>
              <DollarSign className="w-6 h-6 text-purple-500/40" />
            </div>
          </AnimatedCard>
          <AnimatedCard delay={200}>
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] text-gray-400 uppercase">Break Even</p><p className="text-2xl font-bold text-amber-400">{liveROI.breakEvenMonths}mo</p></div>
              <Users className="w-6 h-6 text-amber-500/40" />
            </div>
          </AnimatedCard>
        </div>

        <div className="flex items-center justify-center">
          <ScoreGauge score={Math.min(100, Math.max(0, liveROI.roiPercentage))} label="ROI Score" size="lg" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedCard delay={250}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Cost vs Savings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costVsSavings}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220,25%,15%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: 12 }} formatter={(value) => `$${Number(value ?? 0).toLocaleString()}`} />
              <Bar dataKey="cost" fill="#f87171" radius={[4, 4, 0, 0]} name="Cost" />
              <Bar dataKey="savings" fill="#34d399" radius={[4, 4, 0, 0]} name="Savings" />
            </BarChart>
          </ResponsiveContainer>
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Cumulative Net Benefit</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={cumulativeROI}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220,25%,15%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: 12 }} formatter={(value) => `$${Number(value ?? 0).toLocaleString()}`} />
              <Line type="monotone" dataKey="net" stroke="#60a5fa" strokeWidth={2} dot={false} name="Net Benefit" />
            </LineChart>
          </ResponsiveContainer>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default ROICalculator;
