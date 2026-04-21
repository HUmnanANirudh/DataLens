'use client';

import { SimulationModalProps,SimulationResult } from '@/types';
import { simulateAction } from '@/lib/decisions/simulation';

const METRIC_LABELS: Record<string, string> = {
  churnRate: 'Churn Rate',
  atRiskCustomers: 'At-Risk Customers',
  LTV: 'Customer LTV',
  conversionRate: 'Conversion Rate',
};

export function SimulationModal({ action, baseline, onClose }: SimulationModalProps) {
  const simulation: SimulationResult = simulateAction(action, baseline);

  const metrics = [
    {
      key: 'churnRate',
      before: `${simulation.before.churnRate}%`,
      after: `${simulation.after.churnRate}%`,
      delta: `${simulation.delta.churnRate > 0 ? '+' : ''}${simulation.delta.churnRate}%`,
      isPositive: simulation.delta.churnRate < 0,
    },
    {
      key: 'atRiskCustomers',
      before: simulation.before.atRiskCustomers.toLocaleString(),
      after: simulation.after.atRiskCustomers.toLocaleString(),
      delta: `${simulation.delta.atRiskCustomers > 0 ? '+' : ''}${simulation.delta.atRiskCustomers}`,
      isPositive: simulation.delta.atRiskCustomers < 0,
    },
    {
      key: 'LTV',
      before: `$${simulation.before.LTV.toLocaleString()}`,
      after: `$${simulation.after.LTV.toLocaleString()}`,
      delta: `${simulation.delta.LTV > 0 ? '+' : ''}$${simulation.delta.LTV}`,
      isPositive: simulation.delta.LTV > 0,
    },
    {
      key: 'conversionRate',
      before: `${simulation.before.conversionRate}%`,
      after: `${simulation.after.conversionRate}%`,
      delta: `${simulation.delta.conversionRate > 0 ? '+' : ''}${simulation.delta.conversionRate}%`,
      isPositive: simulation.delta.conversionRate > 0,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Simulate: {action.title}</h2>
              <p className="text-sm text-gray-400 mt-1">Preview impact before implementing</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="bg-white/5 rounded-xl p-4"
              >
                <p className="text-sm text-gray-400 mb-2">{METRIC_LABELS[metric.key]}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">Before</p>
                    <p className="text-lg font-semibold">{metric.before}</p>
                  </div>
                  <div className="text-2xl text-gray-500">→</div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">After</p>
                    <p className={`text-lg font-bold ${metric.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.after}
                    </p>
                  </div>
                </div>
                <div className={`text-center mt-2 text-sm font-medium ${metric.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.delta} change
                </div>
              </div>
            ))}
          </div>

          {/* Impact Summary */}
          <div className="bg-linear-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 text-xl">✓</span>
              <span className="font-semibold">Projected Impact</span>
            </div>
            <p className="text-sm text-gray-300">
              Implementing this action is expected to{' '}
              <span className="text-green-400 font-semibold">
                {action.expectedImpact.delta > 0 ? 'improve' : 'reduce'}
              </span>{' '}
              {action.expectedImpact.metric.replace('_', ' ')} by{' '}
              <span className="text-yellow-400 font-bold">
                {Math.abs(action.expectedImpact.delta)}%
              </span>{' '}
              with{' '}
              <span className="text-blue-400 font-bold">
                {(action.expectedImpact.confidence * 100).toFixed(0)}%
              </span>{' '}
              confidence.
            </p>
          </div>

          {/* Affected Customers */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Affected Customers</span>
              <span className="text-xl font-bold text-purple-400">
                {action.affectedUsers.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 rounded-full h-2 transition-all"
                style={{ width: `${Math.min(100, action.affectedPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {action.affectedPercentage.toFixed(1)}% of total customer base
            </p>
          </div>

          {/* Reasoning */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Action Reasoning</p>
            <ul className="space-y-2">
              {action.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-colors"
          >
            Confirm Strategy
          </button>
        </div>
      </div>
    </div>
  );
}
