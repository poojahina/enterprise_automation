import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const statusStyles: Record<string, string> = {
  'Passed': 'bg-emerald-500',
  'Failed': 'bg-red-500',
  'Pending': 'bg-amber-500',
  'Not Applicable': 'bg-gray-500',
  'To Do': 'bg-gray-500',
  'In Progress': 'bg-blue-500',
  'In Review': 'bg-purple-500',
  'Done': 'bg-emerald-500',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', pulse = false }) => {
  const dotColor = statusStyles[status] ?? 'bg-gray-500';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} font-medium text-gray-200`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`absolute inset-0 rounded-full ${dotColor} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
      </span>
      {status}
    </span>
  );
};

export default StatusBadge;
