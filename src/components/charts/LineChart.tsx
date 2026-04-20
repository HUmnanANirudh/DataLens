'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { LineChartProps } from '@/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export function LineChart({
  data,
  lines,
  xAxisKey = 'index',
  showGrid = true,
  strokeWidth = 2,
  fillArea = false,
  className,
}: LineChartProps & { className?: string }) {
  if (!data || data.length === 0 || !lines || lines.length === 0) return null;

  const chartConfig = lines.reduce((acc, line, index) => {
    const colorVar = `var(--chart-${index + 1})`;
    acc[line.dataKey] = {
      label: line.dataKey,
      color: colorVar,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className={cn("w-full aspect-auto h-45", className)}>
      <RechartsLineChart accessibilityLayer data={data}>
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegendContent />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={`var(--color-${line.dataKey})`}
            strokeWidth={strokeWidth}
            fill={`var(--color-${line.dataKey})`}
            fillOpacity={fillArea ? 0.3 : 0}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}