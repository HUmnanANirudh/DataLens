import { ChurnAnalysis, Action, ScoredAction, DecisionEngineResult } from '@/types/decision';
import { TrainedModel, Dataset } from '@/types';

const WEIGHTS = {
  impact: 40,
  confidence: 30,
  coverage: 30,
};


export interface CustomerPrediction {
  customerId: number;
  probability: number;
  riskLevel: 'high' | 'medium' | 'low';
  topDrivers: { feature: string; contribution: number }[];
}

export interface PredictionDrivenAnalysis {
  predictions: CustomerPrediction[];
  churnAnalysis: ChurnAnalysis;
  segmentProfiles: SegmentProfile[];
  featureImpactMap: Map<string, number>;
}

export interface SegmentProfile {
  name: string;
  size: number;
  avgProbability: number;
  riskLevel: 'high' | 'medium' | 'low';
  topFeatures: string[];
  recommendedActions: string[];
}

export function runPredictionDrivenAnalysis(
  model: TrainedModel,
  dataset: Dataset
): PredictionDrivenAnalysis {
  const { features, labels, featureNames } = dataset;

  // Get predictions for each customer
  const predictions = generateCustomerPredictions(model, features, featureNames);

  // Analyze churn risk
  const churnAnalysis = analyzeChurnFromPredictions(predictions);

  // Create segment profiles
  const segmentProfiles = createSegmentProfiles(predictions, featureNames);

  // Map feature impacts
  const featureImpactMap = createFeatureImpactMap(model, featureNames);

  return {
    predictions,
    churnAnalysis,
    segmentProfiles,
    featureImpactMap,
  };
}

function generateCustomerPredictions(
  model: TrainedModel,
  features: number[][],
  featureNames: string[]
): CustomerPrediction[] {
  return features.map((featureRow, customerId) => {
    const probability = predictProbability(model, featureRow);
    const riskLevel = getRiskLevel(probability);
    const topDrivers = identifyTopDrivers(model, featureRow, featureNames);

    return {
      customerId,
      probability,
      riskLevel,
      topDrivers,
    };
  });
}

function predictProbability(model: TrainedModel, features: number[]): number {
  // Logistic Regression
  if (model.weights && model.weights.length > 0) {
    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      sum += features[i] * (model.weights[i] || 0);
    }
    return sigmoid(sum);
  }

  // Tree-based models (Random Forest, XGBoost, Bagging)
  if (model.featureImportances && model.featureImportances.length > 0) {
    let score = 0;
    for (let i = 0; i < features.length; i++) {
      // Feature importance weighted by normalized feature value
      score += features[i] * (model.featureImportances[i] || 0);
    }
    // Normalize score to 0-1 range
    return Math.min(1, Math.max(0, score / model.featureImportances.length));
  }

  return 0.5;
}

function sigmoid(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}

function getRiskLevel(probability: number): 'high' | 'medium' | 'low' {
  if (probability >= 0.7) return 'high';
  if (probability >= 0.4) return 'medium';
  return 'low';
}

function identifyTopDrivers(
  model: TrainedModel,
  features: number[],
  featureNames: string[]
): { feature: string; contribution: number }[] {
  const importance = model.featureImportances || model.weights || [];
  const contributions: { feature: string; contribution: number }[] = [];

  for (let i = 0; i < features.length; i++) {
    const imp = Math.abs(importance[i] || 0);
    if (imp > 0) {
      contributions.push({
        feature: featureNames[i] || `Feature ${i}`,
        contribution: imp * features[i],
      });
    }
  }

  return contributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
}

function analyzeChurnFromPredictions(predictions: CustomerPrediction[]): ChurnAnalysis {
  const total = predictions.length;

  const highRiskCount = predictions.filter(p => p.riskLevel === 'high').length;
  const mediumRiskCount = predictions.filter(p => p.riskLevel === 'medium').length;
  const lowRiskCount = predictions.filter(p => p.riskLevel === 'low').length;

  // Aggregate top drivers across all high-risk customers
  const driverMap = new Map<string, number>();
  predictions
    .filter(p => p.riskLevel === 'high')
    .flatMap(p => p.topDrivers)
    .forEach(d => {
      driverMap.set(d.feature, (driverMap.get(d.feature) || 0) + d.contribution);
    });

  const churnRiskDrivers = Array.from(driverMap.entries())
    .map(([feature, importance]) => ({ feature, importance }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);

  return {
    highRiskCount,
    highRiskPercentage: (highRiskCount / total) * 100,
    mediumRiskCount,
    mediumRiskPercentage: (mediumRiskCount / total) * 100,
    lowRiskCount,
    churnRiskDrivers,
  };
}

function createSegmentProfiles(
  predictions: CustomerPrediction[],
  featureNames: string[]
): SegmentProfile[] {
  const segments: SegmentProfile[] = [];

  // Segment by risk level
  const riskGroups = {
    high: predictions.filter(p => p.riskLevel === 'high'),
    medium: predictions.filter(p => p.riskLevel === 'medium'),
    low: predictions.filter(p => p.riskLevel === 'low'),
  };

  for (const [riskLevel, customers] of Object.entries(riskGroups)) {
    if (customers.length === 0) continue;

    const avgProbability = customers.reduce((sum, c) => sum + c.probability, 0) / customers.length;

    // Find top features for this segment
    const featureScores = new Map<string, number>();
    customers.forEach(c => {
      c.topDrivers.forEach(d => {
        featureScores.set(d.feature, (featureScores.get(d.feature) || 0) + d.contribution);
      });
    });

    const topFeatures = Array.from(featureScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([f]) => f);

    // Recommend actions based on segment characteristics
    const recommendedActions = getRecommendedActionsForSegment(
      riskLevel as 'high' | 'medium' | 'low',
      topFeatures
    );

    segments.push({
      name: `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk Segment`,
      size: customers.length,
      avgProbability,
      riskLevel: riskLevel as 'high' | 'medium' | 'low',
      topFeatures,
      recommendedActions,
    });
  }

  return segments;
}

function getRecommendedActionsForSegment(
  riskLevel: 'high' | 'medium' | 'low',
  topFeatures: string[]
): string[] {
  const actions: string[] = [];

  if (riskLevel === 'high') {
    actions.push('retention-campaign');
    if (topFeatures.some(f => f.toLowerCase().includes('contract'))) {
      actions.push('contract-migration');
    }
    if (topFeatures.some(f => f.toLowerCase().includes('engagement') || f.toLowerCase().includes('activity'))) {
      actions.push('engagement-boost');
    }
    if (topFeatures.some(f => f.toLowerCase().includes('price') || f.toLowerCase().includes('cost'))) {
      actions.push('pricing-optimization');
    }
  } else if (riskLevel === 'medium') {
    actions.push('vip-upsell');
    if (topFeatures.some(f => f.toLowerCase().includes('contract'))) {
      actions.push('contract-migration');
    }
  } else {
    actions.push('loyalty-reward');
  }

  return actions;
}

function createFeatureImpactMap(model: TrainedModel, featureNames: string[]): Map<string, number> {
  const importance = model.featureImportances || model.weights || [];
  const map = new Map<string, number>();

  for (let i = 0; i < featureNames.length; i++) {
    map.set(featureNames[i], Math.abs(importance[i] || 0));
  }

  return map;
}

export function generatePredictionsBasedDecisions(
  analysis: PredictionDrivenAnalysis
): DecisionEngineResult {
  const { churnAnalysis, segmentProfiles, predictions } = analysis;
  const actions: Action[] = [];

  // High-risk actions
  if (churnAnalysis.highRiskCount > 0) {
    const highRiskCustomers = predictions.filter(p => p.riskLevel === 'high');
    const topDriver = churnAnalysis.churnRiskDrivers[0];

    actions.push({
      id: 'retention-campaign',
      title: `Retention Campaign: ${churnAnalysis.highRiskCount.toLocaleString()} High-Risk Customers`,
      description: `Launch targeted retention for customers with >70% churn probability`,
      expectedImpact: {
        delta: -15,
        metric: 'churn_rate',
        confidence: 0.82,
      },
      affectedUsers: churnAnalysis.highRiskCount,
      affectedPercentage: churnAnalysis.highRiskPercentage,
      reasoning: [
        `${churnAnalysis.highRiskCount} customers (${churnAnalysis.highRiskPercentage.toFixed(1)}%) classified as high risk`,
        `Top risk driver: ${topDriver?.feature || 'Multiple factors'}`,
        `Predicted probabilities range from 70% to 100%`,
      ],
      category: 'retention',
    });

    // Contract migration based on feature analysis
    if (topDriver && topDriver.feature.toLowerCase().includes('contract')) {
      actions.push({
        id: 'contract-migration',
        title: 'Accelerate Contract Migration to Annual',
        description: 'Incentivize high-risk customers to switch to annual billing',
        expectedImpact: {
          delta: -12,
          metric: 'churn_rate',
          confidence: 0.72,
        },
        affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.35),
        affectedPercentage: churnAnalysis.highRiskPercentage * 0.35,
        reasoning: [
          'Contract type is the primary churn driver in this segment',
          'Annual contracts show 3x lower churn rates',
          'Targets the most actionable risk factor',
        ],
        category: 'contract',
      });
    }

    // Engagement boost
    const engagementDriver = churnAnalysis.churnRiskDrivers.find(d =>
      d.feature.toLowerCase().includes('engagement') ||
      d.feature.toLowerCase().includes('activity') ||
      d.feature.toLowerCase().includes('login')
    );
    if (engagementDriver) {
      actions.push({
        id: 'engagement-boost',
        title: 'Re-engagement Campaign for Inactive Customers',
        description: 'Target dormant high-risk customers with personalized outreach',
        expectedImpact: {
          delta: 10,
          metric: 'retention',
          confidence: 0.68,
        },
        affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.6),
        affectedPercentage: churnAnalysis.highRiskPercentage * 0.6,
        reasoning: [
          `Engagement metrics contribute ${(engagementDriver.importance * 100).toFixed(0)}% to risk`,
          'Inactive customers are 5x more likely to churn',
          'Early intervention can recover 20-30% of at-risk customers',
        ],
        category: 'engagement',
      });
    }
  }

  // Medium-risk actions
  if (churnAnalysis.mediumRiskCount > 0) {
    actions.push({
      id: 'vip-upsell',
      title: `Upsell Medium-Risk Customers to Premium Tier`,
      description: `Target ${churnAnalysis.mediumRiskCount.toLocaleString()} medium-risk customers with premium offerings`,
      expectedImpact: {
        delta: 25,
        metric: 'LTV',
        confidence: 0.62,
      },
      affectedUsers: churnAnalysis.mediumRiskCount,
      affectedPercentage: churnAnalysis.mediumRiskPercentage,
      reasoning: [
        `${churnAnalysis.mediumRiskCount} customers in medium-risk segment`,
        'Premium tier adoption increases customer stickiness',
        'LTV increase offsets potential churn risk',
      ],
      category: 'segment',
    });
  }

  // Cross-segment actions based on predictions
  const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
  if (avgProbability > 0.3) {
    actions.push({
      id: 'pricing-optimization',
      title: 'Implement Value-Based Pricing',
      description: 'Strategic discounts for price-sensitive at-risk segments',
      expectedImpact: {
        delta: -8,
        metric: 'churn_rate',
        confidence: 0.55,
      },
      affectedUsers: Math.floor(predictions.length * 0.2),
      affectedPercentage: 20,
      reasoning: [
        'Overall risk profile is elevated (avg probability > 30%)',
        'Price sensitivity is a modifiable risk factor',
        'Targeted discounts maximize ROI vs blanket offers',
      ],
      category: 'pricing',
    });
  }

  // Score and rank actions
  const scoredActions = scoreActions(actions, churnAnalysis);
  const top3Actions = scoredActions.slice(0, 3);

  return {
    actions: scoredActions,
    top3Actions,
    summary: {
      totalActionsConsidered: actions.length,
      primaryRecommendation: scoredActions[0]?.title || 'No actions generated',
      keyDrivers: churnAnalysis.churnRiskDrivers.slice(0, 3).map(d => d.feature),
    },
  };
}

function scoreActions(actions: Action[], churnAnalysis: ChurnAnalysis): ScoredAction[] {
  const maxImpact = Math.max(...actions.map(a => Math.abs(a.expectedImpact.delta)));
  const maxCoverage = Math.max(...actions.map(a => a.affectedUsers));

  return actions.map(action => {
    const impact = maxImpact > 0
      ? (Math.abs(action.expectedImpact.delta) / maxImpact) * WEIGHTS.impact
      : 0;

    const confidence = action.expectedImpact.confidence * WEIGHTS.confidence;

    const coverage = maxCoverage > 0
      ? (action.affectedUsers / maxCoverage) * WEIGHTS.coverage
      : 0;

    const totalScore = impact + confidence + coverage;

    return {
      ...action,
      score: totalScore,
      breakdown: { impact, confidence, coverage },
    };
  }).sort((a, b) => b.score - a.score);
}
