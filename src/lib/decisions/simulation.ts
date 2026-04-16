import { Action, BaselineMetrics } from '@/types';

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

export function simulateAction(
  action: Action,
  baseline: BaselineMetrics
): SimulationResult {
  const { metric, delta } = action.expectedImpact;
  const affectedUsers = action.affectedUsers;

  // Calculate impact multipliers
  const impactFactor = delta / 100;

  // Calculate before metrics
  const before = {
    churnRate: baseline.churnRate,
    atRiskCustomers: baseline.atRiskCustomers,
    LTV: baseline.LTV,
    conversionRate: baseline.conversionRate,
  };

  // Calculate after metrics based on the action's target metric
  const after = { ...before };

  if (metric === 'churn_rate') {
    // Churn rate impact
    const newChurnRate = Math.max(0, before.churnRate * (1 - Math.abs(impactFactor)));
    after.churnRate = Number(newChurnRate.toFixed(2));

    // Also reduce at-risk customers proportionally
    const churnReduction = before.atRiskCustomers * Math.abs(impactFactor);
    after.atRiskCustomers = Math.max(0, before.atRiskCustomers - Math.floor(churnReduction));
  } else if (metric === 'LTV') {
    // LTV impact
    after.LTV = Number((before.LTV * (1 + impactFactor)).toFixed(2));
  } else if (metric === 'conversion_rate') {
    // Conversion rate impact
    after.conversionRate = Number((before.conversionRate * (1 + impactFactor)).toFixed(2));
  } else if (metric === 'retention') {
    // Retention is inverse of churn
    const retentionImprovement = impactFactor;
    const newChurnRate = before.churnRate * (1 - retentionImprovement);
    after.churnRate = Number(Math.max(0, newChurnRate).toFixed(2));

    const churnReduction = before.atRiskCustomers * retentionImprovement;
    after.atRiskCustomers = Math.max(0, before.atRiskCustomers - Math.floor(churnReduction));
  }

  // Calculate delta
  const deltaResult = {
    churnRate: Number((after.churnRate - before.churnRate).toFixed(2)),
    atRiskCustomers: after.atRiskCustomers - before.atRiskCustomers,
    LTV: Number((after.LTV - before.LTV).toFixed(2)),
    conversionRate: Number((after.conversionRate - before.conversionRate).toFixed(2)),
  };

  return { before, after, delta: deltaResult };
}

export function calculateBaseline(
  churnAnalysis: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  },
  totalCustomers: number
): BaselineMetrics {
  const atRiskCustomers = churnAnalysis.highRiskCount + Math.floor(churnAnalysis.mediumRiskCount * 0.5);
  const churnRate = (atRiskCustomers / totalCustomers) * 100;

  return {
    churnRate: Number(churnRate.toFixed(1)),
    atRiskCustomers,
    totalCustomers,
    LTV: 1000, // Default values - would be calculated from actual data
    conversionRate: 5.2, // Default value
  };
}
