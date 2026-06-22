import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';

interface ExplainabilityPanelProps {
  title: string;
  reasoning: string;
  assumptions?: string[];
  details?: Record<string, string | number>;
  defaultOpen?: boolean;
}

const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  title,
  reasoning,
  assumptions = [],
  details = {},
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden" id="explainability-panel">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400">
          <Brain className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-400">AI-generated reasoning and decision logic</p>
        </div>
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-gray-400" />
          : <ChevronRight className="w-4 h-4 text-gray-400" />
        }
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in border-t border-white/10 pt-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reasoning</h4>
            <p className="text-sm text-gray-200 leading-relaxed">{reasoning}</p>
          </div>

          {assumptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assumptions</h4>
              <ul className="space-y-1.5">
                {assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(details).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(details).map(([key, val]) => (
                  <div key={key} className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">{key}</span>
                    <span className="text-xs font-semibold text-gray-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplainabilityPanel;
