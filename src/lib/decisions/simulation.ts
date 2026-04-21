import { Action, BaselineMetrics, SimulationResult } from '@/types';

export function simulateAction(
  action: Action,
  baseline: BaselineMetrics
): SimulationResult {
  const { metric, delta } = action.expectedImpact;

  // Calculate before metrics
  const before = {
    churnRate: baseline.churnRate,
    atRiskCustomers: baseline.atRiskCustomers,
    LTV: baseline.LTV,
    conversionRate: baseline.conversionRate,
  };

  // Calculate after metrics based on the action's target metric
  const after = { ...before };

  // Only affect at-risk customers if the action targets churn
  if (metric === 'churn_rate') {
    // For churn_rate: negative delta = improvement (reduce churn)
    // If delta = -15, new churn rate = current * (1 - 0.15)
    const churnChange = Math.min(delta, 0) / 100; // Only reduce, don't increase churn
    const newChurnRate = Math.max(0, before.churnRate * (1 + churnChange));
    after.churnRate = Number(newChurnRate.toFixed(2));

    // Reduce at-risk customers proportionally to churn improvement
    const churnReduction = before.atRiskCustomers * Math.abs(churnChange);
    after.atRiskCustomers = Math.max(0, before.atRiskCustomers - Math.floor(churnReduction));
  } else if (metric === 'retention') {
    // Retention is inverse of churn - improvement reduces churn
    const retentionImprovement = Math.min(delta, 0) / 100;
    const newChurnRate = before.churnRate * (1 + retentionImprovement);
    after.churnRate = Number(Math.max(0, newChurnRate).toFixed(2));

    const churnReduction = before.atRiskCustomers * Math.abs(retentionImprovement);
    after.atRiskCustomers = Math.max(0, before.atRiskCustomers - Math.floor(churnReduction));
  }
  // LTV and conversion_rate don't directly affect churn metrics in this simplified model
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
