'use client';

import { ColumnAnalysis } from '@/types';
import { BarChart, PieChart, AreaChart } from './charts';

interface UploadResult {
  columns: string[];
  rowCount: number;
  cleanedRowCount: number;
  columnAnalysis: ColumnAnalysis[];
  cleanedPreview: Record<string, string>[];
}

interface DatasetChartsProps {
  uploadResult: UploadResult;
}

export function DatasetCharts({ uploadResult }: DatasetChartsProps) {
  const { columnAnalysis, cleanedPreview } = uploadResult;

  if (columnAnalysis.length === 0) {
    return null;
  }

  // Column Type Distribution - Pie Chart
  const columnTypeData = Object.entries(
    columnAnalysis.reduce((acc, col) => {
      acc[col.type] = (acc[col.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Unique Values per Column - Bar Chart
  const uniqueValuesData = columnAnalysis.map((col) => ({
    name: col.name.length > 15 ? col.name.slice(0, 15) + '...' : col.name,
    value: col.uniqueValues,
  }));

  // Null Values per Column - Bar Chart
  const nullValuesData = columnAnalysis
    .filter((col) => col.nullCount > 0)
    .map((col) => ({
      name: col.name.length > 15 ? col.name.slice(0, 15) + '...' : col.name,
      value: col.nullCount,
    }));

  // Numeric columns for distribution
  const numericColumns = columnAnalysis.filter((col) => col.type === 'numeric');

  // Build numeric distribution data for Area Chart
  const numericDistributionData = numericColumns.slice(0, 3).map((col) => {
    const values = cleanedPreview
      .map((row) => parseFloat(row[col.name]))
      .filter((v) => !isNaN(v))
      .slice(0, 50);
    return { name: col.name, values };
  });

  const maxLen = Math.max(...numericDistributionData.map((d) => d.values.length));
  const areaChartData = Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, unknown> = { index: i + 1 };
    numericDistributionData.forEach((d) => {
      point[d.name] = d.values[i] || null;
    });
    return point;
  });

  const areaChartAreas = numericDistributionData.map((d, i) => ({
    dataKey: d.name,
    stroke: ['#3B82F6', '#10B981', '#F59E0B'][i],
    fill: ['#3B82F6', '#10B981', '#F59E0B'][i],
  }));

  // Categorical distribution
  const categoricalColumns = columnAnalysis.filter((col) => col.type === 'categorical');
  const categoricalChartData = categoricalColumns.slice(0, 4).map((col) => {
    const counts: Record<string, number> = {};
    cleanedPreview.forEach((row) => {
      const value = row[col.name] || '(empty)';
      counts[value] = (counts[value] || 0) + 1;
    });
    return {
      colName: col.name,
      data: Object.entries(counts)
        .map(([value, count]) => ({ name: value, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    };
  });

  return (
    <div className="space-y-8">
      {/* Column Type Distribution */}
      <div className="bg-white/10 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Column Type Distribution</h3>
        <PieChart
          data={columnTypeData}
          dataKey="value"
          colors={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']}
        />
      </div>

      {/* Unique Values per Column */}
      <div className="bg-white/10 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Unique Values per Column</h3>
        <BarChart
          data={uniqueValuesData}
          dataKey="value"
          nameKey="name"
          layout="vertical"
          fill="#3B82F6"
        />
      </div>

      {/* Null Values per Column */}
      {nullValuesData.length > 0 && (
        <div className="bg-white/10 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Null/Empty Values per Column</h3>
          <BarChart
            data={nullValuesData}
            dataKey="value"
            nameKey="name"
            layout="vertical"
            fill="#EF4444"
          />
        </div>
      )}

      {/* Numeric Distribution */}
      {areaChartData.length > 0 && (
        <div className="bg-white/10 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Numeric Column Distributions</h3>
          <AreaChart
            data={areaChartData}
            areas={areaChartAreas}
          />
        </div>
      )}

      {/* Categorical Distribution */}
      {categoricalChartData.length > 0 && (
        <div className="bg-white/10 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Categorical Value Distributions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoricalChartData.map(({ colName, data: chartData }) => (
              <div key={colName} className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 text-gray-300">{colName}</h4>
                <BarChart
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  layout="vertical"
                  height={160}
                  fill="#10B981"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality Summary */}
      <div className="bg-white/10 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Data Quality Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{uploadResult.rowCount.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Total Rows</p>
          </div>
          <div className="bg-green-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{uploadResult.cleanedRowCount.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Clean Rows</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{columnAnalysis.length}</p>
            <p className="text-sm text-gray-400">Features</p>
          </div>
          <div className="bg-red-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-400">
              {columnAnalysis.reduce((sum, c) => sum + c.nullCount, 0)}
            </p>
            <p className="text-sm text-gray-400">Total Nulls</p>
          </div>
        </div>
      </div>
    </div>
  );
}
