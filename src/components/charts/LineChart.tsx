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
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';

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

  const chartConfig = lines.reduce((acc, line, index) => {
    const colorVar = `var(--chart-${index + 1})`;
    acc[line.dataKey] = {
      label: line.dataKey,
      color: colorVar,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
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
        <ChartTooltipContent
          indicator="line"
          formatter={(value) => [value]}
        />
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