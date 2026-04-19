'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, PieChart } from '@/components/charts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
} from '@/components/ui/tooltip';
import { BarChartIcon, PieChartIcon, MessageCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvidenceChartsProps {
  riskDistribution?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  featureImportances?: { feature: string; importance: number }[];
  onAskAbout?: (context: ChartContext) => void;
}

interface ChartContext {
  chartType: string;
  feature?: string;
  value?: number;
  description?: string;
}

export function EvidenceCharts({
  riskDistribution,
  featureImportances,
  onAskAbout,
}: EvidenceChartsProps) {
  const [activeTab, setActiveTab] = useState<'risk' | 'drivers'>('risk');

  const handleAskAbout = useCallback((context: ChartContext) => {
    onAskAbout?.(context);
  }, [onAskAbout]);

  if (!riskDistribution && !featureImportances) {
    return null;
  }

  // Prepare risk distribution data
  const riskData = riskDistribution ? [
    { name: 'High Risk', value: riskDistribution.highRisk },
    { name: 'Medium Risk', value: riskDistribution.mediumRisk },
    { name: 'Low Risk', value: riskDistribution.lowRisk },
  ] : [];

  // Prepare feature importance data
  const importanceData = featureImportances
    ?.slice(0, 8)
    .map(f => ({
      name: f.feature.length > 10 ? f.feature.slice(0, 10) + '...' : f.feature,
      value: Math.round(f.importance * 100),
    })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evidence & Analysis</CardTitle>
            <CardDescription>
              Data supporting the recommended actions
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipContent>Ask about this data</TooltipContent>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleAskAbout({ chartType: 'both', description: 'Evidence charts overview' })}
            >
              <MessageCircleIcon className="size-4" />
            </Button>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'risk' | 'drivers')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="risk" className="gap-2">
              <PieChartIcon className="size-4" data-icon="inline-start" />
              Risk Distribution
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2">
              <BarChartIcon className="size-4" data-icon="inline-start" />
              Key Drivers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risk" className="mt-4">
            {riskData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48">
                  <PieChart
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    height={192}
                  />
                </div>
                <ScrollArea className="h-auto">
                  <div className="grid grid-cols-3 gap-4 pb-2">
                    {riskData.map((item) => (
                      <div
                        key={item.name}
                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleAskAbout({
                          chartType: 'risk',
                          value: item.value,
                          description: `${item.name}: ${item.value} customers`
                        })}
                      >
                        <div
                          className={cn(
                            "size-3 rounded-full shrink-0",
                            item.name === 'High Risk' && "bg-red-500",
                            item.name === 'Medium Risk' && "bg-yellow-500",
                            item.name === 'Low Risk' && "bg-green-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.value.toLocaleString()}</p>
                        </div>
                        <MessageCircleIcon className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No risk distribution data available
              </p>
            )}
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            {importanceData.length > 0 ? (
              <div className="space-y-2">
                <div className="h-48">
                  <BarChart
                    data={importanceData}
                    dataKey="value"
                    nameKey="name"
                    fill="var(--chart-1)"
                    height={192}
                    layout="vertical"
                    showGrid={true}
                    showYAxis={true}
                    showXAxis={true}
                  />
                </div>
                <ScrollArea className="h-auto max-h-48">
                  <div className="space-y-1 pr-4">
                    {importanceData.map((item, index) => (
                      <div
                        key={item.name}
                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleAskAbout({
                          chartType: 'drivers',
                          feature: item.name,
                          value: item.value,
                          description: `${item.name} contributes ${item.value}% to churn risk`
                        })}
                      >
                        <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {item.value}%
                        </span>
                        <MessageCircleIcon className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No feature importance data available
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}