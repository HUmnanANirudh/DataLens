import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngineResult, ChurnAnalysis,Action,ScoredAction } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      predictions,      // { probabilities, riskLevels }
      summary,           // { total, highRisk, mediumRisk, lowRisk, ... }
      featureImportances,
      featureNames,
    } = body;

    if (!predictions || !predictions.probabilities) {
      return NextResponse.json(
        { error: 'Missing prediction data' },
        { status: 400 }
      );
    }

    const { probabilities } = predictions;

    // Build churn analysis from predictions
    const churnAnalysis: ChurnAnalysis = {
      highRiskCount: summary.highRisk,
      highRiskPercentage: summary.highRiskPercent,
      mediumRiskCount: summary.mediumRisk,
      mediumRiskPercentage: summary.mediumRiskPercent,
      lowRiskCount: summary.lowRisk,
      churnRiskDrivers: buildChurnDrivers(featureImportances, featureNames || []),
    };

    // Generate decisions based on predictions
    const decisions = generateDecisions(churnAnalysis, probabilities);

    return NextResponse.json({
      success: true,
      churnAnalysis,
      decisions,
    });
  } catch (error) {
    console.error('Decision error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Decision generation failed' },
      { status: 500 }
    );
  }
}

function buildChurnDrivers(
  featureImportances: number[] = [],
  featureNames: string[] = []
): { feature: string; importance: number }[] {
  return featureNames
    .map((name, index) => ({
      feature: name,
      importance: featureImportances[index] || 0,
    }))
    .filter(f => f.importance > 0)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);
}

const WEIGHTS = {
  impact: 40,
  confidence: 30,
  coverage: 30,
};

function generateDecisions(
  churnAnalysis: ChurnAnalysis,
  probabilities: number[]
): DecisionEngineResult {
  const actions: Action[] = [];
  const total = probabilities.length;

  // Find top driver
  const topDriver = churnAnalysis.churnRiskDrivers[0];

  // 1. Retention Campaign (high risk)
  if (churnAnalysis.highRiskCount > 0) {
    actions.push({
      id: 'retention-campaign',
      title: `Retention Campaign: ${churnAnalysis.highRiskCount.toLocaleString()} High-Risk Customers`,
      description: `Targeted retention for customers with >70% churn probability`,
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
        `Direct intervention is most effective for high-risk segments`,
      ],
      category: 'retention',
    });
  }

  // 2. Contract Migration
  const contractDriver = churnAnalysis.churnRiskDrivers.find(d =>
    d.feature.toLowerCase().includes('contract') ||
    d.feature.toLowerCase().includes('tenure') ||
    d.feature.toLowerCase().includes('term')
  );
  if (contractDriver && contractDriver.importance > 0.12) {
    actions.push({
      id: 'contract-migration',
      title: 'Contract Migration: Monthly to Annual',
      description: 'Incentivize high-risk customers to switch to annual billing',
      expectedImpact: {
        delta: -12,
        metric: 'churn_rate',
        confidence: 0.72,
      },
      affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.4),
      affectedPercentage: churnAnalysis.highRiskPercentage * 0.4,
      reasoning: [
        `${contractDriver.feature} is key churn driver (${(contractDriver.importance * 100).toFixed(0)}% importance)`,
        'Annual contracts show 3x lower churn rates',
        'Immediately actionable with existing customer data',
      ],
      category: 'contract',
    });
  }

  // 3. Engagement Boost
  const engagementDriver = churnAnalysis.churnRiskDrivers.find(d =>
    d.feature.toLowerCase().includes('activity') ||
    d.feature.toLowerCase().includes('engagement') ||
    d.feature.toLowerCase().includes('login') ||
    d.feature.toLowerCase().includes('usage') ||
    d.feature.toLowerCase().includes('frequency')
  );
  if (engagementDriver) {
    actions.push({
      id: 'engagement-boost',
      title: 'Engagement Reactivation Campaign',
      description: 'Re-engage dormant customers with personalized outreach',
      expectedImpact: {
        delta: 10,
        metric: 'retention',
        confidence: 0.68,
      },
      affectedUsers: Math.floor(churnAnalysis.highRiskCount * 0.6),
      affectedPercentage: churnAnalysis.highRiskPercentage * 0.6,
      reasoning: [
        `${engagementDriver.feature} contributes ${(engagementDriver.importance * 100).toFixed(0)}% to churn risk`,
        'Inactive customers are 5x more likely to churn',
        'Personalized re-engagement recovers 20-30% of at-risk',
      ],
      category: 'engagement',
    });
  }

  // 4. VIP Upsell (medium risk)
  if (churnAnalysis.mediumRiskCount > 0) {
    actions.push({
      id: 'vip-upsell',
      title: `Upsell Medium-Risk to Premium`,
      description: `Target medium-risk customers with premium offerings`,
      expectedImpact: {
        delta: 25,
        metric: 'LTV',
        confidence: 0.62,
      },
      affectedUsers: churnAnalysis.mediumRiskCount,
      affectedPercentage: churnAnalysis.mediumRiskPercentage,
      reasoning: [
        `${churnAnalysis.mediumRiskCount} customers in medium-risk segment`,
        'Premium tier adoption increases stickiness',
        'LTV increase offsets potential churn risk',
      ],
      category: 'segment',
    });
  }

  // 5. Pricing Optimization
  const pricingDriver = churnAnalysis.churnRiskDrivers.find(d =>
    d.feature.toLowerCase().includes('price') ||
    d.feature.toLowerCase().includes('cost') ||
    d.feature.toLowerCase().includes('discount') ||
    d.feature.toLowerCase().includes('sensitivity')
  );
  if (pricingDriver) {
    actions.push({
      id: 'pricing-optimization',
      title: 'Strategic Pricing Adjustments',
      description: 'Value-based pricing for price-sensitive segments',
      expectedImpact: {
        delta: -8,
        metric: 'churn_rate',
        confidence: 0.55,
      },
      affectedUsers: Math.floor(total * 0.2),
      affectedPercentage: 20,
      reasoning: [
        `${pricingDriver.feature} is a modifiable risk driver`,
        'Targeted discounts outperform blanket offers',
        'Margin preservation while reducing churn',
      ],
      category: 'pricing',
    });
  }

  // Score and rank
  const scoredActions = scoreActions(actions);

  return {
    actions: scoredActions,
    top3Actions: scoredActions.slice(0, 3),
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

export async function GET() {
  return NextResponse.json({
    message: 'Decision endpoint - POST with { predictions, featureImportances, featureNames }',
  });
}
