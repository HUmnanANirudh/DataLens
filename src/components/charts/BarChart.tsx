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
    <ChartContainer config={chartConfig} className={cn("w-full aspect-auto h-50", className)}>
      <RechartsBarChart 
        accessibilityLayer 
        data={data} 
        layout={layout}
        margin={{ left: layout === 'vertical' ? 20 : 0, right: 20 }}
      >
        {showGrid && <CartesianGrid vertical={false} stroke="var(--border)" />}
        {showXAxis && (
          <XAxis
            type={layout === 'vertical' ? 'number' : 'category'}
            dataKey={layout === 'vertical' ? undefined : nameKey}
            stroke="var(--muted-foreground)"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
            interval={0}
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
            width={layout === 'vertical' ? 150 : 40}
            fontSize={12}
            interval={0}
          />
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegendContent />
        <Bar dataKey={dataKey} fill={fill} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
      </RechartsBarChart>
    </ChartContainer>
  );
}