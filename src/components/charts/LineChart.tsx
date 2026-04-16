'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: Record<string, unknown>[];
  lines: { dataKey: string; stroke?: string; fill?: string }[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  strokeWidth?: number;
  fillArea?: boolean;
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export function LineChart({
  data,
  lines,
  xAxisKey = 'index',
  height = 256,
  showGrid = true,
  strokeWidth = 2,
  fillArea = false,
}: LineChartProps) {
  if (!data || data.length === 0 || !lines || lines.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
        <XAxis dataKey={xAxisKey} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            strokeWidth={strokeWidth}
            fill={line.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            fillOpacity={fillArea ? 0.3 : 0}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
