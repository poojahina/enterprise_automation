import React from 'react';
import { Check } from 'lucide-react';
import type { PipelineStage } from '../../models/types';

interface ProgressStepperProps {
  currentStage: PipelineStage;
}

const STAGES: PipelineStage[] = [
  'Submitted',
  'Classified',
  'Qualified',
  'Scored',
  'Discovery',
  'PRD Creation',
  'Solution Designed',
  'ROI Approved',
  'Prioritized',
  'Pod Allocated',
  'Sprint Ready',
];

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStage }) => {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="w-full overflow-x-auto pb-2" id="pipeline-progress-stepper">
      <div className="flex items-center min-w-max gap-1">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 animate-pulse-glow'
                      : 'bg-white/10 text-gray-500 border border-white/20'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <span
                  className={`text-[9px] font-medium text-center leading-tight max-w-[60px] ${
                    isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-gray-500'
                  }`}
                >
                  {stage}
                </span>
              </div>
              {index < STAGES.length - 1 && (
                <div
                  className={`h-0.5 w-6 flex-shrink-0 rounded-full transition-all duration-300 mt-[-18px] ${
                    index < currentIndex ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
