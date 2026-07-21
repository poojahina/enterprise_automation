import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileStack, Workflow, CheckSquare, BarChart3,
  Search as SearchIcon, Lightbulb, Calculator, Kanban, Users,
  Rocket, FileText, ChevronLeft, ChevronRight, Zap, FileSignature, Settings, ClipboardCheck
} from 'lucide-react';
import { useStore } from '../../state/store';
import { getEnabledPipelineStageStatuses, getStageStatusByRoute } from '../../utils/pipeline';
import { Tooltip } from 'recharts';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Submit Idea', path: '/intake', icon: FileStack },
  { name: 'Classification', path: '/classification', icon: Workflow, Tooltip : 'Triage Agent : Receives and registers requests via FactoryHUB, refines idea classifies against KPMG strategy, Maps optimal platforms and their combination' },
  { name: 'Qualification', path: '/qualification', icon: CheckSquare },
  { name: 'Scoring', path: '/scoring', icon: BarChart3 },
  { name: 'Discovery', path: '/discovery', icon: SearchIcon },
  { name: 'PDD Creation', path: '/pdd', icon: FileSignature },
  { name: 'A2B Readiness', path: '/a2b', icon: ClipboardCheck },
  { name: 'SDD Creation', path: '/sdd', icon: Lightbulb },
  { name: 'User Stories', path: '/user-stories', icon: FileText },
  { name: 'ROI Calculator', path: '/roi', icon: Calculator },
  { name: 'Prioritization', path: '/prioritization', icon: Kanban },
  { name: 'Pod Allocation', path: '/pods', icon: Users },
  { name: 'Sprint Readiness', path: '/sprint-readiness', icon: Rocket },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
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
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.name}
              onMouseEnter={(event) => showTooltip(event, item.name)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(event) => showTooltip(event, item.name)}
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
                <span className="truncate animate-fade-in">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-md border border-white/10 bg-[hsl(220,25%,13%)] px-2.5 py-1.5 text-xs font-medium text-gray-100 shadow-lg shadow-black/30"
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
