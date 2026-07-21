import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileStack, Workflow, CheckSquare, BarChart3,
  Search as SearchIcon, Lightbulb, Calculator, Kanban, Users,
  Rocket, FileText, ChevronLeft, ChevronRight, Zap, FileSignature, Settings, ClipboardCheck, CircleHelp
} from 'lucide-react';
import { useStore } from '../../state/store';
import { getEnabledPipelineStageStatuses, getStageStatusByRoute } from '../../utils/pipeline';

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip?: string;
};

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, tooltip: 'View automation pipeline metrics, stage progress, and opportunity summaries.' },
  { name: 'Submit Idea', path: '/intake', icon: FileStack, tooltip: 'Create and register a new automation opportunity in FactoryHUB.' },
  { name: 'Classification', path: '/classification', icon: Workflow, tooltip: 'Triage Agent: Receives and registers requests via FactoryHUB, refines idea, classifies against KPMG strategy, and maps optimal platforms and their combination.' },
  { name: 'Qualification', path: '/qualification', icon: CheckSquare, tooltip: 'Validate business fit, readiness, value potential, and qualification criteria.' },
  { name: 'Scoring', path: '/scoring', icon: BarChart3, tooltip: 'Score opportunities by feasibility, value, complexity, and delivery confidence.' },
  { name: 'Discovery', path: '/discovery', icon: SearchIcon, tooltip: 'Capture process details, systems, rules, exceptions, and discovery findings.' },
  { name: 'PDD Creation', path: '/pdd', icon: FileSignature, tooltip: 'Generate and review the Process Definition Document for the selected opportunity.' },
  { name: 'A2B Readiness', path: '/a2b', icon: ClipboardCheck, tooltip: 'Check analysis-to-build readiness before moving into solution design.' },
  { name: 'SDD Creation', path: '/sdd', icon: Lightbulb, tooltip: 'Create the Solution Design Document with target architecture and delivery approach.' },
  { name: 'User Stories', path: '/user-stories', icon: FileText, tooltip: 'Generate implementation-ready user stories and acceptance criteria.' },
  { name: 'ROI Calculator', path: '/roi', icon: Calculator, tooltip: 'Estimate benefits, cost savings, investment, payback, and ROI for automation ideas.' },
  { name: 'Prioritization', path: '/prioritization', icon: Kanban, tooltip: 'Compare opportunities and prioritize the best candidates for delivery.' },
  { name: 'Pod Allocation', path: '/pods', icon: Users, tooltip: 'Assign delivery pods and balance work across available automation teams.' },
  { name: 'Sprint Readiness', path: '/sprint-readiness', icon: Rocket, tooltip: 'Review build readiness, dependencies, blockers, and sprint entry criteria.' },
  { name: 'Documents', path: '/documents', icon: FileText, tooltip: 'Access generated artifacts, uploaded files, and project documentation.' },
  { name: 'Settings', path: '/settings', icon: Settings, tooltip: 'Configure pipeline stages, enabled workflow steps, and application settings.' },
];

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, stages } = useStore();
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);
  const enabledStageStatuses = stages.length > 0 ? getEnabledPipelineStageStatuses() : [];
  const visibleNavItems = navItems.filter((item) => {
    const stageStatus = getStageStatusByRoute(item.path);
    return !stageStatus || enabledStageStatuses.length === 0 || enabledStageStatuses.includes(stageStatus);
  });

  const showTooltip = (event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>, label: string) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: bounds.top + bounds.height / 2,
      left: bounds.right + 10,
    });
  };

  return (
    <aside
      className={`flex flex-col bg-[hsl(220,25%,10%)] border-r border-white/10 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
      id="app-sidebar"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-white leading-tight">Factory HUB</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Automation COE</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const tooltipLabel = item.tooltip ?? item.name;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.name}
              onMouseEnter={(event) => showTooltip(event, tooltipLabel)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(event) => showTooltip(event, tooltipLabel)}
              onBlur={() => setTooltip(null)}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate animate-fade-in">{item.name}</span>
                  {item.tooltip && (
                    <CircleHelp className="h-3.5 w-3.5 flex-shrink-0 text-gray-500 transition-colors group-hover:text-blue-300" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-80 -translate-y-1/2 rounded-md border border-white/10 bg-[hsl(220,25%,13%)] px-2.5 py-1.5 text-xs font-medium leading-relaxed text-gray-100 shadow-lg shadow-black/30"
          style={{ top: tooltip.top, left: tooltip.left }}
          role="tooltip"
        >
          {tooltip.label}
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-white/10 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

export default Sidebar;
