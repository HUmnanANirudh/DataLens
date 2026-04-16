'use client';

import { DecisionEngineResult, ChurnAnalysis, Action } from '@/types';
import { ActionCards } from './ActionCards';

interface DecisionsProps {
  decisions: DecisionEngineResult | null;
  churnAnalysis: ChurnAnalysis | null;
  onSimulate?: (action: Action) => void;
}

export function Decisions({ decisions, churnAnalysis, onSimulate }: DecisionsProps) {
  if (!decisions || !churnAnalysis) {
    return null;
  }

  const { top3Actions, summary } = decisions;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-linear-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Top 3 Recommended Actions</h2>
        </div>
        <p className="text-gray-300">Ranked by impact, confidence, and coverage</p>
      </div>

      {/* Churn Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{churnAnalysis.highRiskCount}</p>
          <p className="text-sm text-gray-400">High Risk</p>
          <p className="text-xs text-red-300">{churnAnalysis.highRiskPercentage.toFixed(1)}%</p>
        </div>
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{churnAnalysis.mediumRiskCount}</p>
          <p className="text-sm text-gray-400">Medium Risk</p>
          <p className="text-xs text-yellow-300">{churnAnalysis.mediumRiskPercentage.toFixed(1)}%</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{churnAnalysis.lowRiskCount}</p>
          <p className="text-sm text-gray-400">Low Risk</p>
          <p className="text-xs text-green-300">{(100 - churnAnalysis.highRiskPercentage - churnAnalysis.mediumRiskPercentage).toFixed(1)}%</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{churnAnalysis.churnRiskDrivers[0]?.feature || 'N/A'}</p>
          <p className="text-sm text-gray-400">Top Driver</p>
        </div>
      </div>

      {/* Top 3 Action Cards */}
      <ActionCards actions={top3Actions} onSimulate={onSimulate} />

      {/* Key Drivers */}
      <div className="bg-white/10 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Key Churn Drivers</h3>
        <div className="flex flex-wrap gap-2">
          {summary.keyDrivers.map((driver, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-gray-700 rounded-full text-sm"
            >
              {driver}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
