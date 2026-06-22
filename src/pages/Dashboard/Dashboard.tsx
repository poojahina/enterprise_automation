import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import {
  Lightbulb, CheckCircle2, BarChart3, Rocket, TrendingUp, Workflow,
  ArrowRight, Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import KPICard from '../../components/shared/KPICard';
import Badge from '../../components/shared/Badge';
import AnimatedCard from '../../components/shared/AnimatedCard';
import type { AutomationType } from '../../models/types';

const COLORS: Record<AutomationType, string> = {
  'Hyperautomation/Agentic Automation': '#a78bfa',
  'RPA': '#60a5fa',
  'Intelligent Automation': '#22d3ee',
  'Power Automate/Power Platform': '#fbbf24',
};

const Dashboard: React.FC = () => {
  const { opportunities } = useStore();
  const navigate = useNavigate();

  // KPI calculations
  const totalIdeas = opportunities.length;
  const classified = opportunities.filter(o => o.classification).length;
  const qualified = opportunities.filter(o => o.qualification?.status === 'Qualified').length;
  const scored = opportunities.filter(o => o.score).length;
  const sprintReady = opportunities.filter(o => o.sprintReadiness?.status === 'Sprint Ready').length;
  const avgROI = opportunities
    .filter(o => o.businessCase)
    .reduce((sum, o) => sum + (o.businessCase?.roiPercentage ?? 0), 0) /
    (opportunities.filter(o => o.businessCase).length || 1);

  // Chart data
  const typeDistribution = Object.entries(
    opportunities.reduce((acc, o) => {
      const type = o.classification?.recommendedType ?? 'Unclassified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace('/', '/\n'), value, fullName: name }));

  const stageData = [
    { name: 'Submitted', value: totalIdeas, fill: '#6b7280' },
    { name: 'Classified', value: classified, fill: '#60a5fa' },
    { name: 'Qualified', value: qualified, fill: '#a78bfa' },
    { name: 'Scored', value: scored, fill: '#22d3ee' },
    { name: 'Sprint Ready', value: sprintReady, fill: '#34d399' },
  ];

  const priorityRadar = [
    { subject: 'Business Impact', A: 85 },
    { subject: 'Strategic Align', A: 72 },
    { subject: 'Feasibility', A: 68 },
    { subject: 'ROI Potential', A: 78 },
    { subject: 'Complexity', A: 55 },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-page">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMEgydjRoMzR6TTIgMThoMzR2LTJIMXY0em0wIDEyaDM0di0ySDF2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Automation Opportunity Intake Hub</h1>
          </div>
          <p className="text-base font-semibold text-blue-200 max-w-3xl leading-relaxed">
            Standardized, AI-driven intake pipeline that converts ideas into prioritized, sprint-ready automation opportunities.
          </p>
          <p className="text-sm text-gray-300 mt-2 max-w-3xl leading-relaxed italic">
            "Automate this intake workflow using AI-driven scoring, rule-based qualification, and integration with backlog tools such as Jira, ensuring minimal manual intervention and real-time prioritization."
          </p>
          <button
            onClick={() => navigate('/intake')}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
            id="submit-idea-button"
          >
            <Lightbulb className="w-4 h-4" />
            Submit New Idea
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Total Ideas" value={totalIdeas} change={12} trend="up" icon={<Lightbulb className="w-5 h-5" />} color="from-blue-500/20 to-blue-600/10" delay={0} />
        <KPICard label="Classified" value={classified} change={8} trend="up" icon={<Workflow className="w-5 h-5" />} color="from-purple-500/20 to-purple-600/10" delay={50} />
        <KPICard label="Qualified" value={qualified} change={5} trend="up" icon={<CheckCircle2 className="w-5 h-5" />} color="from-cyan-500/20 to-cyan-600/10" delay={100} />
        <KPICard label="Scored" value={scored} change={3} trend="up" icon={<BarChart3 className="w-5 h-5" />} color="from-emerald-500/20 to-emerald-600/10" delay={150} />
        <KPICard label="Sprint Ready" value={sprintReady} change={15} trend="up" icon={<Rocket className="w-5 h-5" />} color="from-green-500/20 to-green-600/10" delay={200} />
        <KPICard label="Avg ROI" value={`${Math.round(avgROI)}%`} change={10} trend="up" icon={<TrendingUp className="w-5 h-5" />} color="from-amber-500/20 to-amber-600/10" delay={250} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Funnel */}
        <AnimatedCard delay={100}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Pipeline Funnel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220,25%,15%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {stageData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AnimatedCard>

        {/* Type Distribution */}
        <AnimatedCard delay={200}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Automation Type Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%" cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {typeDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[entry.fullName as AutomationType] ?? '#6b7280'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220,25%,15%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {typeDistribution.map((entry) => (
              <div key={entry.fullName} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[entry.fullName as AutomationType] ?? '#6b7280' }} />
                <span className="text-[10px] text-gray-400">{entry.fullName.split('/')[0]}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Priority Radar */}
        <AnimatedCard delay={300}>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Average Scoring Dimensions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={priorityRadar} cx="50%" cy="50%" outerRadius={75}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 9 }} />
              <Radar dataKey="A" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </AnimatedCard>
      </div>

      {/* Recent Opportunities Table */}
      <AnimatedCard delay={400}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Recent Opportunities</h3>
          <button
            onClick={() => navigate('/prioritization')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Process</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr
                  key={opp.id}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigate('/classification')}
                >
                  <td className="px-3 py-2.5 text-xs font-mono text-blue-400">{opp.id}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-200 max-w-[200px] truncate">{opp.processName}</td>
                  <td className="px-3 py-2.5">
                    {opp.classification && <Badge variant="automation" value={opp.classification.recommendedType} />}
                  </td>
                  <td className="px-3 py-2.5"><Badge variant="stage" value={opp.currentStage} /></td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-gray-200">{opp.score?.totalScore ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    {opp.score && <Badge variant="priority" value={opp.score.priorityBand} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedCard>
    </div>
  );
};

export default Dashboard;
