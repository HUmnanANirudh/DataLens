'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AreaChartProps } from '@/types';

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export function AreaChart({
  data,
  areas,
  xAxisKey = 'index',
  height = 256,
  showGrid = true,
  fillOpacity = 0.3,
}: AreaChartProps) {
  if (!data || data.length === 0 || !areas || areas.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
        <XAxis dataKey={xAxisKey} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            stroke={area.stroke || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            fill={area.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            fillOpacity={fillOpacity}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
