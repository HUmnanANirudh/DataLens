export interface ChartContextType {
  chartType: string;
  feature?: string;
  value?: number;
  description?: string;
  segment?: string;
}

export interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
  chartContext?: ChartContextType;
  initialMessage?: string;
}

export interface ChatContext {
  churnRate?: number;
  highRiskCount?: number;
  mediumRiskCount?: number;
  lowRiskCount?: number;
  topDrivers?: string[];
  actions?: { title: string; id: string }[];
  segments?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  chartData?: {
    type: string;
    feature?: string;
    value?: number;
    segment?: string;
    description?: string;
  };
  currentAction?: {
    id: string;
    title: string;
    confidence: number;
    expectedImpact: {
      delta: number;
      metric: string;
      confidence: number;
    };
    affectedUsers: number;
    reasoning: string[];
  };
  datasetInfo?: {
    name: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
    columnAnalysis: Array<{
      name: string;
      type: string;
      uniqueValues: number;
      min?: number;
      max?: number;
      mean?: number;
      missingPct?: number;
      topValues?: Array<{ value: string; count: number; pct: string }>;
    }>;
    isValid: boolean;
    validationScore: number;
    validationReasons: string[];
  };
}

export interface EvidenceChartsProps {
  riskDistribution?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  featureImportances?: { feature: string; importance: number }[];
  onAskAbout?: (context: ChartContextType) => void;
  simulationActive?: boolean;
  simulatedMetrics?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

export interface ChartDataPoint {
  type: string;
  label: string;
  value: number;
  feature?: string;
  color?: string;
}