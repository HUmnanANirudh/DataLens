'use client';

import { Action } from '@/types';

interface ActionCardsProps {
  actions: Action[];
  onSimulate?: (action: Action) => void;
}

const CATEGORY_COLORS = {
  retention: 'border-red-500 bg-red-500/10',
  contract: 'border-blue-500 bg-blue-500/10',
  engagement: 'border-purple-500 bg-purple-500/10',
  pricing: 'border-yellow-500 bg-yellow-500/10',
  segment: 'border-green-500 bg-green-500/10',
};

const METRIC_LABELS = {
  churn_rate: 'Churn Rate',
  LTV: 'LTV',
  conversion_rate: 'Conversion',
  retention: 'Retention',
};

export function ActionCards({ actions, onSimulate }: ActionCardsProps) {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white/10 border rounded-lg p-8 text-center">
        <p className="text-gray-400">No actions generated yet. Train a model first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actions.slice(0, 3).map((action, index) => (
        <div
          key={action.id}
          className={`border-2 rounded-xl p-6 ${CATEGORY_COLORS[action.category] || 'border-gray-500'}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-gray-400 text-black' :
                'bg-orange-600 text-white'
              }`}>
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{action.title}</h3>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {action.category}
                </span>
              </div>
            </div>
            {onSimulate && (
              <button
                onClick={() => onSimulate(action)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                Simulate
              </button>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-300 mb-4">{action.description}</p>

          {/* Impact & Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Expected Impact</p>
              <p className={`text-xl font-bold ${
                action.expectedImpact.delta > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {action.expectedImpact.delta > 0 ? '+' : ''}{action.expectedImpact.delta}%
              </p>
              <p className="text-xs text-gray-500">{METRIC_LABELS[action.expectedImpact.metric]}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Confidence</p>
              <p className="text-xl font-bold text-blue-400">
                {(action.expectedImpact.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Affected</p>
              <p className="text-xl font-bold text-purple-400">
                {action.affectedUsers.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                ({action.affectedPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Reasoning</p>
            <ul className="space-y-1">
              {action.reasoning.map((reason, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
