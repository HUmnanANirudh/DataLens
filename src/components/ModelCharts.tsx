import { BarChart } from './charts';
import { ModelChartsProps } from '@/types';

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
  const importanceData = bestModel.modelData?.featureImportances
    ?.map((imp, i) => ({
      name: columns[i] || `Feature ${i + 1}`,
      value: imp,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) || [];

  const percentFormatter = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-4">
      {/* Row 1: F1 Comparison + Best Model Metrics side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Model F1 Score Comparison</h3>
          <BarChart
            data={leaderboardData}
            dataKey="value"
            nameKey="name"
            fill="#3B82F6"
            formatter={percentFormatter}
            className="h-37.5"
          />
        </div>
        <div className="bg-white/10 border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            Best Model Metrics — {bestModel.name}
          </h3>
          <BarChart
            data={metricsData}
            dataKey="value"
            nameKey="name"
            layout="vertical"
            fill="#10B981"
            formatter={percentFormatter}
            className="h-37.5"
          />
        </div>
      </div>

      {/* Row 2: Feature Importance - full width */}
      {importanceData.length > 0 && (
        <div className="bg-white/10 border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            Feature Importance — {bestModel.name}
          </h3>
          <BarChart
            data={importanceData}
            dataKey="value"
            nameKey="name"
            layout="vertical"
            fill="#F59E0B"
            formatter={percentFormatter}
            className="h-40"
          />
        </div>
      )}
    </div>
  );
}
