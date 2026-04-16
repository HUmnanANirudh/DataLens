export interface AreaChartProps {
  data: Record<string, unknown>[];
  areas: { dataKey: string; stroke?: string; fill?: string }[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  fillOpacity?: number;
}
export interface BarChartProps {
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
export interface LineChartProps {
  data: Record<string, unknown>[];
  lines: { dataKey: string; stroke?: string; fill?: string }[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  strokeWidth?: number;
  fillArea?: boolean;
}

export interface PieChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
  showLabels?: boolean;
}
