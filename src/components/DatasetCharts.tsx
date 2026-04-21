import { DatasetChartsProps } from '@/types';
import { BarChart, PieChart } from './charts';
import { ScrollArea } from './ui/scroll-area';

export function DatasetCharts({ uploadResult }: DatasetChartsProps) {
  const { columnAnalysis } = uploadResult;

  if (columnAnalysis.length === 0) {
    return null;
  }

  // Column Type Distribution - Donut Chart
  const columnTypeData = Object.entries(
    columnAnalysis.reduce((acc, col) => {
      acc[col.type] = (acc[col.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Unique Values per Column - Bar Chart
  const uniqueValuesData = columnAnalysis.map((col) => ({
    name: col.name.length > 24 ? col.name.slice(0, 24) + '…' : col.name,
    value: col.uniqueValues,
  }));

  // Numeric column statistics - using full cleanedData for accurate stats
  const numericColumns = columnAnalysis.filter((col) => col.type === 'numeric');
  const numericStats = numericColumns.map((col) => {
    const values = uploadResult.cleanedData
      .map((row) => parseFloat(row[col.name]))
      .filter((v) => !isNaN(v));

    // Use reduce instead of Math.min/max with spread to avoid stack overflow on large datasets
    const min = values.reduce((a, b) => Math.min(a, b), values[0] ?? 0);
    const max = values.reduce((a, b) => Math.max(a, b), values[0] ?? 0);
    const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const missing = uploadResult.cleanedData.filter((row) => !row[col.name] || row[col.name] === '').length;
    const missingPct = uploadResult.cleanedData.length ? (missing / uploadResult.cleanedData.length) * 100 : 0;
    return {
      name: col.name,
      min: min.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      max: max.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      mean: mean.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      unique: col.uniqueValues,
      missingPct: missingPct.toFixed(1),
    };
  });

  // Categorical column summary - using full cleanedData for accurate counts, showing top 3
  const categoricalColumns = columnAnalysis.filter((col) => col.type === 'categorical');
  const categoricalSummary = categoricalColumns.map((col) => {
    const counts: Record<string, number> = {};
    uploadResult.cleanedData.forEach((row) => {
      const value = row[col.name] || '(empty)';
      counts[value] = (counts[value] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      name: col.name,
      uniqueCount: col.uniqueValues,
      topValues: sorted.map(([val, count]) => ({
        value: val.length > 20 ? val.slice(0, 20) + '…' : val,
        count,
        pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      })),
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 border rounded-lg p-4 md:col-span-1">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Column Type Distribution</h3>
          <PieChart
            data={columnTypeData}
            dataKey="value"
            colors={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']}
            showLabels={false}
          />
        </div>
        <div className="bg-white/10 border rounded-lg p-4 md:col-span-2">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Unique Values per Column</h3>
          <BarChart
            data={uniqueValuesData}
            dataKey="value"
            nameKey="name"
            fill="#3B82F6"
            layout="vertical"
            height={Math.max(200, uniqueValuesData.length * 40)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {numericStats.length > 0 && (
          <div className="bg-white/10 border rounded-lg p-4 h-62.5">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Numeric Column Statistics</h3>
            <ScrollArea className="h-[calc(100%-2rem)] px-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Column</th>
                    <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Min</th>
                    <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Max</th>
                    <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Mean</th>
                  </tr>
                </thead>
                <tbody>
                  {numericStats.map((stat) => (
                    <tr key={stat.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-1.5 pr-3 font-medium truncate max-w-30" title={stat.name}>
                        {stat.name.length > 15 ? stat.name.slice(0, 15) + '…' : stat.name}
                      </td>
                      <td className="text-right py-1.5 px-2 font-mono text-blue-400">{stat.min}</td>
                      <td className="text-right py-1.5 px-2 font-mono text-blue-400">{stat.max}</td>
                      <td className="text-right py-1.5 px-2 font-mono text-emerald-400">{stat.mean}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        {/* Categorical Column Summary */}
        {categoricalSummary.length > 0 && (
          <div className="bg-white/10 border rounded-lg p-4 h-62.5">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Categorical Column Summary</h3>
            <ScrollArea className="h-[calc(100%-2rem)] pr-3">
              <div className="space-y-3">
              {categoricalSummary.map((col) => (
                <div key={col.name} className="bg-white/5 rounded-md p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium truncate max-w-37.5" title={col.name}>
                      {col.name.length > 20 ? col.name.slice(0, 20) + '…' : col.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                      {col.uniqueCount} unique
                    </span>
                  </div>
                  <div className="space-y-1">
                    {col.topValues.map((tv) => (
                      <div key={tv.value} className="flex items-center gap-2 text-[11px]">
                        <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500/70"
                            style={{ width: `${Math.min(parseFloat(tv.pct), 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-300 truncate max-w-25" title={tv.value}>{tv.value}</span>
                        <span className="text-muted-foreground shrink-0">{tv.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
