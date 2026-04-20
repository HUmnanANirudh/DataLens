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
  // Initial message to auto-send when chat opens
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
  // Currently selected action for detailed explanation
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
  // Dataset info - available immediately after upload
  datasetInfo?: {
    name: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
    columnAnalysis: Array<{
      name: string;
      type: string;
      uniqueValues: number;
      // Numeric stats
      min?: number;
      max?: number;
      mean?: number;
      missingPct?: number;
      // Categorical stats
      topValues?: Array<{ value: string; count: number; pct: string }>;
    }>;
    isValid: boolean;
    validationScore: number;
    validationReasons: string[];
  };
}