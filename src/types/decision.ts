export interface Action {
  id: string;
  title: string;
  description: string;
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
  top3Actions: Action[];
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
