'use client';

import { BarChart } from './charts';

interface ModelEvaluation {
  accuracy: number;
  f1: number;
  precision: number;
  recall: number;
}

interface ModelResult {
  name: string;
  type: string;
  evaluation: ModelEvaluation;
  featureImportances?: number[];
}

interface TrainingResult {
  success: boolean;
  leaderboard: { name: string; f1: number }[];
  bestModel: ModelResult;
  totalModels: number;
}

interface ModelChartsProps {
  trainingResult: TrainingResult;
  columns: string[];
}

export function ModelCharts({ trainingResult, columns }: ModelChartsProps) {
  const { leaderboard, bestModel } = trainingResult;

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  // Format leaderboard data for chart
  const leaderboardData = leaderboard.map((m) => ({
    name: m.name,
    value: m.f1,
  }));

  // Best model metrics data
  const metricsData = [
    { name: 'Accuracy', value: bestModel.evaluation.accuracy },
    { name: 'F1 Score', value: bestModel.evaluation.f1 },
    { name: 'Precision', value: bestModel.evaluation.precision },
    { name: 'Recall', value: bestModel.evaluation.recall },
  ];

  // Feature importance data
  const importanceData = bestModel.featureImportances
    ?.map((imp, i) => ({
      name: columns[i] || `Feature ${i + 1}`,
      value: imp,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) || [];

  const percentFormatter = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-8">
      {/* F1 Score Leaderboard Chart */}
      <div className="bg-white/10 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Model F1 Score Comparison</h3>
        <BarChart
          data={leaderboardData}
          dataKey="value"
          nameKey="name"
          fill="#3B82F6"
          formatter={percentFormatter}
        />
      </div>

      {/* Best Model Metrics */}
      <div className="bg-white/10 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Best Model Metrics - {bestModel.name}
        </h3>
        <BarChart
          data={metricsData}
          dataKey="value"
          nameKey="name"
          layout="vertical"
          fill="#10B981"
          formatter={percentFormatter}
        />
      </div>

      {/* Feature Importance Chart */}
      {importanceData.length > 0 && (
        <div className="bg-white/10 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Feature Importance - {bestModel.name}
          </h3>
          <BarChart
            data={importanceData}
            dataKey="value"
            nameKey="name"
            layout="vertical"
            fill="#F59E0B"
            formatter={percentFormatter}
          />
        </div>
      )}
    </div>
  );
}
