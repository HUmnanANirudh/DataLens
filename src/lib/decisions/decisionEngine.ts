import { DecisionEngineResult, Action, ScoredAction, ChurnAnalysis } from '@/types';

const WEIGHTS = {
  impact: 40,
  confidence: 30,
  coverage: 30,
};

export function generateDecisions(
  churnAnalysis: ChurnAnalysis
): DecisionEngineResult {
  const actions: Action[] = [];

  // 1. Retention Campaign Action (highest priority if high risk)
  if (churnAnalysis.highRiskCount > 0) {
    actions.push({
      id: 'retention-campaign',
      title: `Retention Campaign: ${churnAnalysis.highRiskCount.toLocaleString()} High-Risk Customers`,
      description: 'Launch targeted retention efforts for customers with >70% churn probability',
      expectedImpact: {
        delta: -15,
        metric: 'churn_rate',
        confidence: 0.82,
      },
      affectedUsers: churnAnalysis.highRiskCount,
      affectedPercentage: churnAnalysis.highRiskPercentage,
      reasoning: [
        `${churnAnalysis.highRiskCount} customers (${churnAnalysis.highRiskPercentage.toFixed(1)}%) show high churn risk`,
        'Immediate intervention can prevent significant revenue loss',
        'Based on top risk drivers: ' + churnAnalysis.churnRiskDrivers.slice(0, 2).map(d => d.feature).join(', '),
      ],
      category: 'retention',
    });
  }

  // 2. Contract Migration Action
  const contractDriver = churnAnalysis.churnRiskDrivers.find(d =>
    d.feature.toLowerCase().includes('contract') || d.feature.toLowerCase().includes('tenure')
  );
  if (contractDriver && contractDriver.importance > 0.15) {
    actions.push({
      id: 'contract-migration',
      title: 'Convert Month-to-Month to Annual Contracts',
      description: 'Incentivize high-risk customers to switch from monthly to annual billing',
      expectedImpact: {
        delta: -12,
        metric: 'churn_rate',
        confidence: 0.70,
      },
      affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.4),
      affectedPercentage: churnAnalysis.highRiskPercentage * 0.4,
      reasoning: [
        `Contract type is a key churn driver (${(contractDriver.importance * 100).toFixed(0)}% importance)`,
        'Annual contracts show 3x lower churn rates typically',
        'Targets most at-risk segment with actionable fix',
      ],
      category: 'contract',
    });
  }

  // 3. Engagement Campaign
  const engagementDriver = churnAnalysis.churnRiskDrivers.find(d =>
    d.feature.toLowerCase().includes('activity') ||
    d.feature.toLowerCase().includes('engagement') ||
    d.feature.toLowerCase().includes('login') ||
    d.feature.toLowerCase().includes('usage')
  );
  if (engagementDriver) {
    actions.push({
      id: 'engagement-boost',
      title: 'Boost Customer Engagement',
      description: 'Re-engage dormant customers with personalized outreach',
      expectedImpact: {
        delta: 8,
        metric: 'retention',
        confidence: 0.65,
      },
      affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.6),
      affectedPercentage: churnAnalysis.highRiskPercentage * 0.6,
      reasoning: [
        `Engagement patterns contribute ${(engagementDriver.importance * 100).toFixed(0)}% to churn risk`,
        'Inactive customers are 5x more likely to churn',
        'Personalized re-engagement can recover 20-30% of at-risk customers',
      ],
      category: 'engagement',
    });
  }

  // 4. VIP Segment Upsell
  if (churnAnalysis.mediumRiskCount > 0) {
    actions.push({
      id: 'vip-upsell',
      title: 'Upsell High-Value Medium-Risk Customers',
      description: 'Target medium-risk customers with premium offerings to increase LTV',
      expectedImpact: {
        delta: 25,
        metric: 'LTV',
        confidence: 0.60,
      },
      affectedUsers: churnAnalysis.mediumRiskCount,
      affectedPercentage: churnAnalysis.mediumRiskPercentage,
      reasoning: [
        `${churnAnalysis.mediumRiskCount} customers in medium-risk segment`,
        'These customers have potential for LTV increase',
        'Premium tier adoption reduces churn motivation',
      ],
      category: 'segment',
    });
  }

  // 5. Pricing Optimization
  const pricingDriver = churnAnalysis.churnRiskDrivers.find(d =>
    d.feature.toLowerCase().includes('price') ||
    d.feature.toLowerCase().includes('cost') ||
    d.feature.toLowerCase().includes('discount')
  );
  if (pricingDriver) {
    actions.push({
      id: 'pricing-optimization',
      title: 'Implement Loyalty Discounts',
      description: 'Offer targeted discounts to price-sensitive at-risk customers',
      expectedImpact: {
        delta: -8,
        metric: 'churn_rate',
        confidence: 0.55,
      },
      affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.3),
      affectedPercentage: churnAnalysis.highRiskPercentage * 0.3,
      reasoning: [
        `Price sensitivity is a churn driver (${(pricingDriver.importance * 100).toFixed(0)}% importance)`,
        'Strategic discounts can prevent churn at minimal margin cost',
        'Loyalty discounts increase long-term customer value',
      ],
      category: 'pricing',
    });
  }

  // Score and rank actions
  const scoredActions = scoreActions(actions);
  const top3Actions = scoredActions.slice(0, 3).map(sa => ({
    ...sa,
    score: undefined as unknown as number,
    breakdown: undefined as unknown as { impact: number; confidence: number; coverage: number },
  })) as Action[];

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

function scoreActions(actions: Action[]): ScoredAction[] {
  const maxImpact = Math.max(...actions.map(a => Math.abs(a.expectedImpact.delta)));
  const maxCoverage = Math.max(...actions.map(a => a.affectedUsers));

  return actions.map(action => {
    // Impact score (0-40)
    const impact = maxImpact > 0
      ? (Math.abs(action.expectedImpact.delta) / maxImpact) * WEIGHTS.impact
      : 0;

    // Confidence score (0-30)
    const confidence = action.expectedImpact.confidence * WEIGHTS.confidence;

    // Coverage score (0-30)
    const coverage = maxCoverage > 0
      ? (action.affectedUsers / maxCoverage) * WEIGHTS.coverage
      : 0;

    const totalScore = impact + confidence + coverage;

    return {
      ...action,
      score: totalScore,
      breakdown: {
        impact,
        confidence,
        coverage,
      },
    };
  }).sort((a, b) => b.score - a.score);
}
