'use client';

import { ScoredAction } from '@/types';
import { ActionCard } from '@/components/action-card';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ActionSectionProps } from '@/types';

export function ActionSection({
  top3Actions,
  churnAnalysis,
  onSimulate,
  onAskAbout,
}: ActionSectionProps) {
  // Prepare chart data for each action based on churn drivers
  const prepareChartData = (action: ScoredAction) => {
    const actionText = (action.title + ' ' + action.reasoning.join(' ')).toLowerCase();

    const relevantDrivers = churnAnalysis.churnRiskDrivers
      .filter(driver => {
        const driverText = driver.feature.toLowerCase();
        // Check if action mentions this driver directly or via common synonyms
        return actionText.includes(driverText) ||
               // Check for partial matches with common churn-related terms
               (actionText.includes('high risk') && actionText.includes('retention')) ||
               (actionText.includes('medium risk') && actionText.includes('upsell')) ||
               (actionText.includes('tenure') && driverText.includes('tenure')) ||
               (actionText.includes('contract') && driverText.includes('contract')) ||
               (actionText.includes('engagement') && (driverText.includes('engagement') || driverText.includes('usage')));
      })
      .slice(0, 5);

    // Fallback: if no drivers matched, show top drivers
    if (relevantDrivers.length === 0) {
      return churnAnalysis.churnRiskDrivers.slice(0, 5).map(d => ({
        name: d.feature.length > 12 ? d.feature.slice(0, 12) + '...' : d.feature,
        value: Math.round(d.importance * 100),
      }));
    }

    return relevantDrivers.map(d => ({
      name: d.feature.length > 12 ? d.feature.slice(0, 12) + '...' : d.feature,
      value: Math.round(d.importance * 100),
    }));
  };

  const totalAtRisk = churnAnalysis.highRiskCount + churnAnalysis.mediumRiskCount;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Top 3 Actions</h2>
          <p className="text-sm text-muted-foreground">
            Prioritized actions based on impact, confidence, and coverage
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-2xl font-bold">{totalAtRisk.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">At-Risk Customers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-2xl font-bold">{churnAnalysis.highRiskCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">High Risk ({churnAnalysis.highRiskPercentage?.toFixed(1) || 0}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-2xl font-bold">{churnAnalysis.churnRiskDrivers.length}</p>
                <p className="text-xs text-muted-foreground">Key Drivers Identified</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Top 3 Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {top3Actions.map((action, index) => (
          <ActionCard
            key={action.id}
            action={action}
            index={index}
            chartData={prepareChartData(action)}
            onSimulate={onSimulate}
            onAskAbout={onAskAbout}
          />
        ))}
      </div>
    </div>
  );
}