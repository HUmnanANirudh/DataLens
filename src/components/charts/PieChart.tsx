'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

import { PieChartProps } from '@/types';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'] as const;

export function PieChart({
  data,
  dataKey,
  nameKey = 'name',
  height = 256,
  showLabels = true,
}: PieChartProps) {
  if (!data || data.length === 0) return null;

  const chartConfig: ChartConfig = {};
  data.forEach((item, index) => {
    const key = String(item[nameKey] || index);
    chartConfig[key] = {
      label: key,
      color: COLORS[index % COLORS.length],
    };
  });

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <RechartsPieChart accessibilityLayer>
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
          dataKey={dataKey}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`var(--color-${String(data[index]?.[nameKey] || index)})`}
            />
          ))}
        </Pie>
        <ChartTooltipContent
          indicator="dot"
          formatter={(value) => [value]}
        />
        <ChartLegendContent />
      </RechartsPieChart>
    </ChartContainer>
  );
}