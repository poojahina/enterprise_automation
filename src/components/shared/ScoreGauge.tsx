import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0-100
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label, size = 'md', color }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const autoColor = normalizedScore >= 75 ? '#34d399' : normalizedScore >= 45 ? '#fbbf24' : '#f87171';
  const strokeColor = color ?? autoColor;

  const sizeMap = {
    sm: { container: 'w-20 h-20', text: 'text-lg', label: 'text-[9px]' },
    md: { container: 'w-28 h-28', text: 'text-2xl', label: 'text-[10px]' },
    lg: { container: 'w-36 h-36', text: 'text-3xl', label: 'text-xs' },
  };

  const s = sizeMap[size];

  return (
    <div className={`relative ${s.container} flex items-center justify-center`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${s.text} font-bold text-white`}>{normalizedScore}</span>
        <span className={`${s.label} font-medium text-gray-400 uppercase tracking-wider mt-0.5`}>{label}</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
