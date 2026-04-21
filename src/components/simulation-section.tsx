'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowRightIcon, RefreshCwIcon, CheckIcon } from 'lucide-react';
import { SimulationSectionProps } from '@/types';
import { cn } from '@/lib/utils';

export function SimulationSection({
  action,
  baseline,
  simulatedResult,
  onSimulate,
  onReset,
  onApply,
}: SimulationSectionProps) {
  const isSimulated = !!simulatedResult;
  const result = simulatedResult || null;

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatDelta = (delta: number) => delta > 0 ? `+${delta}` : `${delta}`;

  const getDeltaColor = (delta: number, isChurnRate: boolean) => {
    if (isChurnRate) {
      return delta < 0 ? 'text-green-500' : 'text-red-500';
    }
    return delta > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Strategy Simulation
              {isSimulated && (
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                  <CheckIcon className="size-3 mr-1" />
                  Simulated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {action.title}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isSimulated ? (
              <Button onClick={onSimulate} size="sm">
                Run Simulation
              </Button>
            ) : (
              <>
                <Button onClick={onApply} size="sm" variant="default">
                  Apply Simulation
                </Button>
                <Button variant="outline" onClick={onReset} size="sm">
                  <RefreshCwIcon className="size-4 mr-2" data-icon="inline-start" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Before */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Before</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Churn Rate</span>
                <span className="font-mono">{formatPercent(baseline.churnRate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">At-Risk Customers</span>
                <span className="font-mono">{baseline.atRiskCustomers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">LTV</span>
                <span className="font-mono">${baseline.LTV.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* After (or Arrow) */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {isSimulated ? 'After' : 'After (Projected)'}
            </p>
            {isSimulated && result ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Churn Rate</span>
                  <span className={cn("font-mono flex items-center gap-1", getDeltaColor(result.delta.churnRate, true))}>
                    {formatPercent(result.after.churnRate)}
                    <span className="text-xs">
                      ({formatDelta(result.delta.churnRate)})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">At-Risk Customers</span>
                  <span className={cn("font-mono flex items-center gap-1", getDeltaColor(result.delta.atRiskCustomers, true))}>
                    {result.after.atRiskCustomers.toLocaleString()}
                    <span className="text-xs">
                      ({formatDelta(result.delta.atRiskCustomers)})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">LTV</span>
                  <span className={cn("font-mono flex items-center gap-1", getDeltaColor(result.delta.LTV, false))}>
                    ${result.after.LTV.toLocaleString()}
                    <span className="text-xs">
                      ({formatDelta(result.delta.LTV)})
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <ArrowRightIcon className="size-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
        {isSimulated && result && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Impact Breakdown</p>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">Churn Rate</span>
                  <Progress
                    value={100}
                    className="flex-1 h-2"
                  />
                  <span className={cn("text-sm font-mono w-20 text-right", getDeltaColor(result.delta.churnRate, true))}>
                    {formatDelta(result.delta.churnRate)}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">At-Risk</span>
                  <Progress
                    value={100}
                    className="flex-1 h-2"
                  />
                  <span className={cn("text-sm font-mono w-20 text-right", getDeltaColor(result.delta.atRiskCustomers, true))}>
                    {formatDelta(result.delta.atRiskCustomers)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">LTV</span>
                  <Progress
                    value={100}
                    className="flex-1 h-2"
                  />
                  <span className={cn("text-sm font-mono w-20 text-right", getDeltaColor(result.delta.LTV, false))}>
                    {formatDelta(result.delta.LTV)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
        {!isSimulated && (
          <div className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Click `&quot;Run Simulation&quot;` to see projected impact of this action
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}