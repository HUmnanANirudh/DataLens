'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { PieChartProps } from '@/types';

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export function PieChart({
  data,
  dataKey,
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  height = 256,
  showLabels = true,
}: PieChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={showLabels}
          label={({ name, percent }) =>
            showLabels ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : undefined
          }
          nameKey={nameKey}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [value]}
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
