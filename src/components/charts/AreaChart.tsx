'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { AreaChartProps } from '@/types';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';

export function AreaChart({
  data,
  areas,
  xAxisKey = 'index',
  height = 256,
  showGrid = true,
  fillOpacity = 0.3,
}: AreaChartProps) {
  if (!data || data.length === 0 || !areas || areas.length === 0) return null;

  const chartConfig = areas.reduce((acc, area, index) => {
    const colorVar = `var(--chart-${index + 1})`;
    acc[area.dataKey] = {
      label: area.dataKey,
      color: colorVar,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <RechartsAreaChart accessibilityLayer data={data}>
        {showGrid && <CartesianGrid vertical={false} stroke="var(--border)" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="var(--muted-foreground)"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => String(value).slice(0, 3)}
        />
        <YAxis
          stroke="var(--muted-foreground)"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltipContent
          indicator="dot"
          formatter={(value) => [value]}
        />
        <ChartLegendContent />
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            fill={`var(--color-${area.dataKey})`}
            fillOpacity={fillOpacity}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
}