export interface PredictionResult {
  probabilities: number[];
  predictions: number[];
  riskLevels: ('high' | 'medium' | 'low')[];
  summary: PredictionSummary;
}

export interface PredictionSummary {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  highRiskPercent: number;
  mediumRiskPercent: number;
  lowRiskPercent: number;
  avgProbability: number;
}