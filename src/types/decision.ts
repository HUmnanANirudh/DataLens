export interface Action {
  id: string;
  title: string;
  description: string;
  confidence: number;
  expectedImpact: {
    delta: number;
    metric: 'churn_rate' | 'LTV' | 'conversion_rate' | 'retention';
    confidence: number;
  };
  affectedUsers: number;
  affectedPercentage: number;
  reasoning: string[];
  category: 'retention' | 'contract' | 'engagement' | 'pricing' | 'segment';
}

export interface ScoredAction extends Action {
  score: number;
  breakdown: {
    impact: number;
    confidence: number;
    coverage: number;
  };
}

export interface DecisionEngineResult {
  actions: ScoredAction[];
  top3Actions: ScoredAction[];
  summary: {
    totalActionsConsidered: number;
    primaryRecommendation: string;
    keyDrivers: string[];
  };
}

export interface ChurnAnalysis {
  highRiskCount: number;
  highRiskPercentage: number;
  mediumRiskCount: number;
  mediumRiskPercentage: number;
  lowRiskCount: number;
  churnRiskDrivers: { feature: string; importance: number }[];
}

export interface BaselineMetrics {
  churnRate: number;
  atRiskCustomers: number;
  totalCustomers: number;
  LTV: number;
  conversionRate: number;
}

export interface PredictionDrivenAnalysis {
  predictions: CustomerPrediction[];
  churnAnalysis: ChurnAnalysis;
  segmentProfiles: SegmentProfile[];
  featureImpactMap: Record<string, number>;
}

export interface CustomerPrediction {
  customerId: number;
  probability: number;
  riskLevel: 'high' | 'medium' | 'low';
  topDrivers: { feature: string; contribution: number }[];
}

export interface SegmentProfile {
  name: string;
  size: number;
  avgProbability: number;
  riskLevel: 'high' | 'medium' | 'low';
  topFeatures: string[];
  recommendedActions: string[];
}

export interface SimulationResult {
  before: {
    churnRate: number;
    atRiskCustomers: number;
    LTV: number;
    conversionRate: number;
  };
  after: {
    churnRate: number;
    atRiskCustomers: number;
    LTV: number;
    conversionRate: number;
  };
  delta: {
    churnRate: number;
    atRiskCustomers: number;
    LTV: number;
    conversionRate: number;
  };
}

export interface SimulationSectionProps {
  action: Action;
  baseline: BaselineMetrics;
  simulatedResult?: SimulationResult;
  onSimulate?: () => void;
  onReset?: () => void;
  onApply?: () => void;
}

export interface ActionSectionProps {
  top3Actions: ScoredAction[];
  churnAnalysis: {
    highRiskCount: number;
    highRiskPercentage: number;
    mediumRiskCount: number;
    mediumRiskPercentage: number;
    lowRiskCount: number;
    churnRiskDrivers: { feature: string; importance: number }[];
  };
  onSimulate?: (action: ScoredAction) => void;
  onAskAbout?: (action: ScoredAction, context?: string) => void;
}

export interface ActionCardProps {
  action: ScoredAction;
  index: number;
  chartData?: { name: string; value: number }[];
  onSimulate?: (action: ScoredAction) => void;
  onAskAbout?: (action: ScoredAction, context?: string) => void;
}
