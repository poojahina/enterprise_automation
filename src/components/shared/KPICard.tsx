import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, change, trend = 'stable', icon, color = 'from-blue-500/20 to-blue-600/10', delay = 0 }) => {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${color} backdrop-blur-sm p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
      id={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(change)}% {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'stable'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
