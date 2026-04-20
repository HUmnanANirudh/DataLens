'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';

import { PieChartProps } from '@/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export function PieChart({
  data,
  dataKey,
  nameKey = 'name',
  showLabels = true,
  className,
  colors
}: PieChartProps & { className?: string }) {
  if (!data || data.length === 0) return null;

  const chartConfig: ChartConfig = {};
  const dataWithColors = data.map((item, index) => {
  const key = String(item[nameKey] || index);

  const color =
    colors?.[index] ||
    `var(--chart-${(index % 4) + 1})`;
  chartConfig[key] = { label: key, color };

  return { ...item, fill: color };
});

  return (
    <ChartContainer config={chartConfig} className={cn("w-full aspect-auto h-45", className)}>
      <RechartsPieChart accessibilityLayer>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          labelLine={showLabels}
          label={({ name, percent }) =>
            showLabels ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : undefined
          }
          nameKey={nameKey}
          outerRadius={55}
          dataKey={dataKey}
          fill="fill"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegendContent />
      </RechartsPieChart>
    </ChartContainer>
  );
}