'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey?: string;
  layout?: 'horizontal' | 'vertical';
  fill?: string;
  height?: number;
  domain?: [number, number] | [number, 'auto'];
  formatter?: (value: number) => string;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

export function BarChart({
  data,
  dataKey,
  nameKey = 'name',
  layout = 'horizontal',
  fill = '#3B82F6',
  height = 256,
  domain = [0, 'auto'],
  formatter,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout={layout}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
        {showXAxis && (
          <XAxis
            type={layout === 'vertical' ? 'number' : 'category'}
            dataKey={layout === 'vertical' ? undefined : nameKey}
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
          />
        )}
        {showYAxis && (
          <YAxis
            type={layout === 'vertical' ? 'category' : 'number'}
            dataKey={layout === 'vertical' ? nameKey : undefined}
            domain={domain}
            tickFormatter={formatter}
            stroke="#9CA3AF"
          />
        )}
        <Tooltip
          formatter={(value) => [formatter ? formatter(Number(value)) : value]}
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        <Bar dataKey={dataKey} fill={fill} radius={[0, 4, 4, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
