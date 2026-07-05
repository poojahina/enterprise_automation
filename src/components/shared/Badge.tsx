import React from 'react';
import type { AutomationType, PipelineStage } from '../../models/types';

interface BadgeProps {
  variant: 'automation' | 'priority' | 'stage' | 'complexity' | 'status';
  value: string;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  // Automation types
  'Azure AI': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Automation Anywhere': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Power Platform': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  // Priority bands
  'High': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Critical': 'bg-red-600/20 text-red-300 border-red-600/30',
  'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Low': 'bg-green-500/20 text-green-300 border-green-500/30',
  // Complexity
  'XS': 'bg-green-500/20 text-green-300 border-green-500/30',
  'S': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'M': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'L': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'XL': 'bg-red-500/20 text-red-300 border-red-500/30',
  // Qualification status
  'Qualified': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Needs More Information': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  // Sprint readiness
  'Sprint Ready': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Blocked': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Not Ready': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  // Pipeline stages
  'Submitted': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Classified': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Scored': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Discovery': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'PDD Creation': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'SDD Creation': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'ROI Approved': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Prioritized': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Pod Allocated': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

const Badge: React.FC<BadgeProps> = ({ value, size = 'sm' }) => {
  const colors = colorMap[value] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${colors} ${sizeClasses}`}>
      {value}
    </span>
  );
};

export default Badge;
