'use client';

import { ScoredAction } from '@/types';
import { ActionCard } from '@/components/ui/action-card';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FlameIcon, TrendingDownIcon, UsersIcon } from 'lucide-react';

interface ActionSectionProps {
  top3Actions: ScoredAction[];
  churnAnalysis: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    churnRiskDrivers: { feature: string; importance: number }[];
  };
  onSimulate?: (action: ScoredAction) => void;
  onAskAbout?: (action: ScoredAction, context?: string) => void;
}

export function ActionSection({
  top3Actions,
  churnAnalysis,
  onSimulate,
  onAskAbout,
}: ActionSectionProps) {
  // Prepare chart data for each action based on churn drivers
  const prepareChartData = (action: ScoredAction) => {
    const relevantDrivers = churnAnalysis.churnRiskDrivers
      .filter(driver => {
        const reason = action.reasoning.join(' ').toLowerCase();
        return driver.feature.toLowerCase().includes('contract') ||
               driver.feature.toLowerCase().includes('tenure') ||
               driver.feature.toLowerCase().includes('activity') ||
               driver.feature.toLowerCase().includes('engagement') ||
               driver.feature.toLowerCase().includes('usage') ||
               driver.feature.toLowerCase().includes('price') ||
               driver.feature.toLowerCase().includes('discount');
      })
      .slice(0, 5);

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
        <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/10">
          <FlameIcon className="size-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Top 3 Actions</h2>
          <p className="text-sm text-muted-foreground">
            Prioritized actions based on impact, confidence, and coverage
          </p>
        </div>
      </div>

      {/* Key Metrics Banner */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-red-500/10">
                <TrendingDownIcon className="size-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAtRisk.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">At-Risk Customers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/10">
                <UsersIcon className="size-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{churnAnalysis.highRiskCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">High Risk ({churnAnalysis.highRiskPercentage?.toFixed(1) || 0}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="size-10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{churnAnalysis.churnRiskDrivers.length}</span>
              </Badge>
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