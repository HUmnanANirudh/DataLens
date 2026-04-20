'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { BarChartProps } from '@/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export function BarChart({
  data,
  dataKey,
  nameKey = 'name',
  layout = 'horizontal',
  fill = 'var(--chart-1)',
  domain = [0, 'auto'],
  formatter,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  className,
}: BarChartProps & { className?: string }) {
  if (!data || data.length === 0) return null;

  const chartConfig = {
    [dataKey]: { label: nameKey, color: fill },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className={cn("w-full aspect-auto h-45", className)}>
      <RechartsBarChart accessibilityLayer data={data} layout={layout}>
        {showGrid && <CartesianGrid vertical={false} stroke="var(--border)" />}
        {showXAxis && (
          <XAxis
            type={layout === 'vertical' ? 'number' : 'category'}
            dataKey={layout === 'vertical' ? undefined : nameKey}
            stroke="var(--muted-foreground)"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => String(value).slice(0, 3)}
          />
        )}
        {showYAxis && (
          <YAxis
            type={layout === 'vertical' ? 'category' : 'number'}
            dataKey={layout === 'vertical' ? nameKey : undefined}
            domain={domain}
            tickFormatter={formatter}
            stroke="var(--muted-foreground)"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegendContent />
        <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={[0, 4, 4, 0]} />
      </RechartsBarChart>
    </ChartContainer>
  );
}