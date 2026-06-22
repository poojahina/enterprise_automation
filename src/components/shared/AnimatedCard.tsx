import React from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, className = '', delay = 0, hover = true }) => {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 animate-slide-up ${
        hover ? 'transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5' : ''
      } ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
