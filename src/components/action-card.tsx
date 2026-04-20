'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { BarChart } from '@/components/charts/BarChart';
import {
  Tooltip,
  TooltipContent,
} from '@/components/ui/tooltip';
import { MessageCircleIcon, PlayIcon, ChevronDownIcon, ChevronUpIcon, HelpCircleIcon } from 'lucide-react';
import { ScoredAction } from '@/types';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  action: ScoredAction;
  index: number;
  chartData?: { name: string; value: number }[];
  onSimulate?: (action: ScoredAction) => void;
  onAskAbout?: (action: ScoredAction, context?: string) => void;
}

export function ActionCard({
  action,
  index,
  chartData,
  onSimulate,
  onAskAbout,
}: ActionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const confidencePercent = Math.round(action.confidence * 100);
  const impactValue = action.expectedImpact.delta > 0
    ? `+${action.expectedImpact.delta}%`
    : `${action.expectedImpact.delta}%`;

  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'outline';
  };

  const getImpactColor = (delta: number) => {
    if (action.expectedImpact.metric === 'churn_rate') {
      return delta < 0 ? 'text-green-500' : 'text-red-500';
    }
    return delta > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-medium">
                #{index + 1}
              </Badge>
              <Badge variant={getConfidenceVariant(action.confidence)}>
                {confidencePercent}% confidence
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight">{action.title}</CardTitle>
            <CardDescription className="mt-2">{action.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Impact Metrics */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expected Impact</p>
            <p className={cn("text-xl font-bold", getImpactColor(action.expectedImpact.delta))}>
              {impactValue}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {action.expectedImpact.metric.replace('_', ' ')}
            </p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Affected Users</p>
            <p className="text-xl font-bold">{action.affectedUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {action.affectedPercentage.toFixed(1)}% of total
            </p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Score</p>
            <p className="text-xl font-bold">{action.score.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>

        {/* Chart (if provided) */}
        {chartData && chartData.length > 0 && (
          <div className="pt-2 isolate">
            <p className="text-xs text-muted-foreground mb-2">Supporting Evidence</p>
              <BarChart
                data={chartData.slice(0, 5)}
                dataKey="value"
                nameKey="name"
                fill="var(--chart-1)"
                height={128}
                showGrid={false}
                showYAxis={false}
              />
          </div>
        )}

        {/* Why? Section */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger
            render={
              <Button variant="ghost" className="w-full justify-between p-0 h-auto py-2" />
            }
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <HelpCircleIcon className="size-4" />
              Why this action?
            </span>
            {isOpen ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 z-20 bg-card relative">
            <div className="space-y-2">
              {action.reasoning.map((reason, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span className="text-muted-foreground">{reason}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onSimulate?.(action)}
            className="flex-1"
          >
            <PlayIcon className="size-4 mr-2" data-icon="inline-start" />
            Simulate
          </Button>
          <Tooltip>
            <TooltipContent>Ask about this action</TooltipContent>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onAskAbout?.(action)}
            >
              <MessageCircleIcon className="size-4" />
            </Button>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}