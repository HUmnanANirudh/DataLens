'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, PieChart } from '@/components/charts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { BarChartIcon, PieChartIcon, MessageCircleIcon, SendIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartContextType as ChartContext } from '@/types';

interface EvidenceChartsProps {
  riskDistribution?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  featureImportances?: { feature: string; importance: number }[];
  onAskAbout?: (context: ChartContext) => void;
  simulationActive?: boolean;
  simulatedMetrics?: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}


interface ChartDataPoint {
  type: string;
  label: string;
  value: number;
  feature?: string;
  color?: string;
}

export function EvidenceCharts({
  riskDistribution,
  featureImportances,
  onAskAbout,
  simulationActive = false,
  simulatedMetrics,
}: EvidenceChartsProps) {
  const [activeTab, setActiveTab] = useState<'risk' | 'drivers'>('risk');
  const [hoveredData, setHoveredData] = useState<ChartDataPoint | null>(null);
  const [inlineQuestion, setInlineQuestion] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleAskAbout = useCallback((context: ChartContext) => {
    onAskAbout?.(context);
  }, [onAskAbout]);

  const handleInlineAsk = useCallback(() => {
    if (!hoveredData || !inlineQuestion.trim()) return;
    handleAskAbout({
      chartType: hoveredData.type,
      feature: hoveredData.feature,
      value: hoveredData.value,
      segment: hoveredData.label, // Include the segment label (e.g., "High Risk", "Tenure")
      description: inlineQuestion,
    });
    setInlineQuestion('');
    setPopoverOpen(false);
  }, [hoveredData, inlineQuestion, handleAskAbout]);

  if (!riskDistribution && !featureImportances) {
    return null;
  }

  // Use simulated metrics if simulation is active, otherwise use original
  const displayMetrics = simulationActive && simulatedMetrics ? simulatedMetrics : riskDistribution;

  // Prepare risk distribution data
  const riskData = displayMetrics ? [
    { name: 'High Risk', value: displayMetrics.highRisk, color: simulationActive ? 'bg-red-500/30' : 'bg-red-500' },
    { name: 'Medium Risk', value: displayMetrics.mediumRisk, color: simulationActive ? 'bg-yellow-500/30' : 'bg-yellow-500' },
    { name: 'Low Risk', value: displayMetrics.lowRisk, color: simulationActive ? 'bg-green-500/30' : 'bg-green-500' },
  ] : [];

  // Prepare feature importance data
  const importanceData = featureImportances
    ?.map(f => ({
      name: f.feature.length > 20 ? f.feature.slice(0, 20) + '...' : f.feature,
      fullName: f.feature,
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
          <div className="flex items-center gap-2">
            {simulationActive && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Simulation Active
              </span>
            )}
            <TooltipProvider>
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
            </TooltipProvider>
          </div>
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
                <div className={cn("rounded-lg p-2", simulationActive && "ring-2 ring-primary ring-offset-2")}>
                  <PieChart
                    data={riskData.map(d => ({ name: d.name, value: d.value }))}
                    dataKey="value"
                    nameKey="name"
                    height={160}
                    colors={['#ef4444', '#eab308', '#22c55e']}
                  />
                </div>
                <ScrollArea className="h-auto">
                  <div className="grid grid-cols-3 gap-4 pb-2">
                    {riskData.map((item) => (
                      <Popover key={item.name} open={popoverOpen && hoveredData?.label === item.name} onOpenChange={(open) => {
                        if (open) setHoveredData({ type: 'risk', label: item.name, value: item.value, color: item.color });
                        setPopoverOpen(open);
                      }}>
                        <PopoverTrigger className={cn(
                              "group flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer w-full",
                              simulationActive ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-muted/50 hover:border-muted"
                            )}>
                            <div
                              className="size-3 rounded-full shrink-0"
                              style={{ backgroundColor: item.name === 'High Risk' ? '#ef4444' : item.name === 'Medium Risk' ? '#eab308' : '#22c55e' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.value.toLocaleString()}</p>
                            </div>
                            {simulationActive ? (
                              <MessageCircleIcon className="size-4 text-primary" />
                            ) : (
                              <MessageCircleIcon className="size-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Ask about {item.name}:</p>
                            <p className="text-xs text-muted-foreground">
                              Why is this segment at {item.value} customers?
                            </p>
                            <Textarea
                              placeholder="Why is this high?"
                              value={inlineQuestion}
                              onChange={(e) => setInlineQuestion(e.target.value)}
                              className="min-h-15 resize-none text-sm"
                            />
                            <Button size="sm" onClick={handleInlineAsk} disabled={!inlineQuestion.trim()}>
                              <SendIcon className="size-3 mr-2" />
                              Ask
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
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
                <div className={cn("rounded-lg p-2", simulationActive && "ring-2 ring-primary ring-offset-2")}>
                  <BarChart
                    data={importanceData}
                    dataKey="value"
                    nameKey="name"
                    fill="var(--chart-2)"
                    height={Math.max(160, importanceData.length * 30)}
                    layout="vertical"
                    showGrid={true}
                    showYAxis={true}
                    showXAxis={true}
                  />
                </div>
                <ScrollArea className="h-48 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-4">
                    {importanceData.map((item, index) => (
                      <Popover key={item.name} onOpenChange={(open) => {
                        if (open) setHoveredData({ type: 'drivers', label: item.name, value: item.value, feature: item.fullName });
                        setPopoverOpen(open);
                      }}>
                        <PopoverTrigger className={cn(
                              "group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer w-full",
                              simulationActive ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-muted/50 hover:border-muted"
                            )}>
                            <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{item.name}</p>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {item.value}%
                            </span>
                            {simulationActive ? (
                              <MessageCircleIcon className="size-3.5 text-primary" />
                            ) : (
                              <MessageCircleIcon className="size-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                            )}
                          </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Ask about {item.fullName}:</p>
                            <p className="text-xs text-muted-foreground">
                              This driver contributes {item.value}% to churn risk
                            </p>
                            <Textarea
                              placeholder="Why does this drive churn?"
                              value={inlineQuestion}
                              onChange={(e) => setInlineQuestion(e.target.value)}
                              className="min-h-15 resize-none text-sm"
                            />
                            <Button size="sm" onClick={handleInlineAsk} disabled={!inlineQuestion.trim()}>
                              <SendIcon className="size-3 mr-2" />
                              Ask
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
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