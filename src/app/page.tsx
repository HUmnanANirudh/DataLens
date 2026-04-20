'use client';

import { useState, useCallback } from 'react';
import { UploadResult, TrainingResult, DecisionEngineResult, ChurnAnalysis,BaselineMetrics, PredictionResult, BestModel, ScoredAction, ChatContext, DatasetValidationResult } from '@/types';
import { DatasetCharts } from '@/components/DatasetCharts';
import { ActionSection } from '@/components/action-section';
import { EvidenceCharts } from '@/components/evidence-charts';
import { SimulationSection } from '@/components/simulation-section';
import { DatasetValidator } from '@/components/dataset-validator';
import { calculateBaseline } from '@/lib/decisions/simulation';
import { ChatBot } from '@/components/ChatBot';
import { MessageSquareIcon, BarChartIcon, PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [datasetValidation, setDatasetValidation] = useState<DatasetValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Training state
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [targetValidation, setTargetValidation] = useState<{ status: 'idle' | 'valid' | 'weak' | 'continuous' | 'invalid'; message: string }>({ status: 'idle', message: '' });
  const [trainingResult, setTrainingResult] = useState<TrainingResult & { bestModel: BestModel; featureNames?: string[] } | null>(null);
  const [training, setTraining] = useState(false);

  // Prediction state
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Decisions state
  const [decisions, setDecisions] = useState<DecisionEngineResult | null>(null);
  const [churnAnalysis, setChurnAnalysis] = useState<ChurnAnalysis | null>(null);
  const [deciding, setDeciding] = useState(false);

  // Simulation state
  const [selectedAction, setSelectedAction] = useState<ScoredAction | null>(null);
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [simulationResult, setSimulationResult] = useState<{ before: BaselineMetrics; after: { churnRate: number; atRiskCustomers: number; LTV: number; conversionRate: number }; delta: { churnRate: number; atRiskCustomers: number; LTV: number; conversionRate: number } } | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [chartContext, setChartContext] = useState<{ chartType: string; feature?: string; value?: number; description?: string } | null>(null);

  const handleReset = useCallback(() => {
    setFile(null);
    setUploadResult(null);
    setDatasetValidation(null);
    setTrainingResult(null);
    setPredictionResult(null);
    setDecisions(null);
    setChurnAnalysis(null);
    setSimulationResult(null);
    setSelectedAction(null);
    setBaseline(null);
    setSimulationActive(false);
    setTargetColumn('');
    setTargetValidation({ status: 'idle', message: '' });
  }, []);

  const validateTarget = useCallback((col: string) => {
    if (!col || !uploadResult) {
      setTargetValidation({ status: 'idle', message: '' });
      return;
    }

    const colAnalysis = uploadResult.columnAnalysis.find((c: { name: string }) => c.name === col);
    if (!colAnalysis) {
      setTargetValidation({ status: 'invalid', message: `Column "${col}" not found in dataset` });
      return;
    }

    const uniqueValues = colAnalysis.uniqueValues;
    const isBinary = uniqueValues === 2;
    const isLowCardinality = uniqueValues <= 5;
    const isHighCardinality = uniqueValues > 10 && colAnalysis.type === 'numeric';

    // Case A: Valid binary target
    if (isBinary) {
      setTargetValidation({
        status: 'valid',
        message: `Using "${col}" as target (binary classification)`,
      });
      return;
    }

    // Case B: High cardinality continuous - will be converted
    if (isHighCardinality) {
      setTargetValidation({
        status: 'continuous',
        message: `"${col}" is continuous. Will convert to binary using median split.`,
      });
      return;
    }

    // Case C: Low cardinality categorical (not binary)
    if (isLowCardinality && !isBinary) {
      setTargetValidation({
        status: 'weak',
        message: `"${col}" has only ${uniqueValues} categories. This may have limited predictive power.`,
      });
      return;
    }

    // Case D: Invalid - too many classes for categorical
    if (!isBinary && uniqueValues > 5) {
      setTargetValidation({
        status: 'invalid',
        message: `"${col}" has ${uniqueValues} unique values. Not suitable as classification target.`,
      });
      return;
    }

    // Default: weak
    setTargetValidation({
      status: 'weak',
      message: `"${col}" may not be ideal as a target column.`,
    });
  }, [uploadResult]);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setTrainingResult(null);
    setPredictionResult(null);
    setDecisions(null);
    setChurnAnalysis(null);
    setSimulationResult(null);
    setTargetColumn('');
    setTargetValidation({ status: 'idle', message: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload_csv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);

      // Store validation result
      if (data.datasetValidation) {
        setDatasetValidation(data.datasetValidation);
      }

      // Set chat context with dataset info (available immediately after upload)
      // Build enhanced column analysis with stats for chat context
      const enhancedColumnAnalysis = data.columnAnalysis.map((col: { name: string; type: string; uniqueValues: number; variance?: number }) => {
        const base = {
          name: col.name,
          type: col.type,
          uniqueValues: col.uniqueValues,
        };

        if (col.type === 'numeric') {
          const values = data.cleanedData
            .map((row: Record<string, string>) => parseFloat(row[col.name]))
            .filter((v: number) => !isNaN(v));
          const min = values.length ? values.reduce((a: number, b: number) => Math.min(a, b), values[0]) : 0;
          const max = values.length ? values.reduce((a: number, b: number) => Math.max(a, b), values[0]) : 0;
          const mean = values.length ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
          const missing = data.cleanedData.filter((row: Record<string, string>) => !row[col.name] || row[col.name] === '').length;
          const missingPct = (missing / data.cleanedData.length) * 100;
          return { ...base, min, max, mean, missingPct };
        }

        if (col.type === 'categorical') {
          const counts: Record<string, number> = {};
          data.cleanedData.forEach((row: Record<string, string>) => {
            const value = row[col.name] || '(empty)';
            counts[value] = (counts[value] || 0) + 1;
          });
          const sorted = Object.entries(counts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 5);
          const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
          const topValues = sorted.map(([val, count]) => ({
            value: val.length > 25 ? val.slice(0, 25) + '…' : val,
            count,
            pct: ((count / total) * 100).toFixed(1),
          }));
          return { ...base, topValues };
        }

        return base;
      });

      setChatContext({
        datasetInfo: {
          name: file.name,
          rowCount: data.rowCount,
          columnCount: data.columns.length,
          columns: data.columns,
          columnAnalysis: enhancedColumnAnalysis,
          isValid: data.datasetValidation?.isValid || false,
          validationScore: data.datasetValidation?.score || 0,
          validationReasons: data.datasetValidation?.reasons || [],
        },
      });

      // Auto-select target if available (prioritizing obvious targets like churn)
      const validTargetColumns = data.columns.filter((col: string) => {
        const idPatterns = ['id', 'customer_id', 'uuid', 'guid', 'index', 'serial'];
        const lowerCol = col.toLowerCase();
        const isIdLike = idPatterns.some(p => lowerCol.includes(p));
        const colAnalysis = data.columnAnalysis.find((c: { name: string }) => c.name === col);
        const isFullyUnique = colAnalysis && colAnalysis.uniqueValues === data.rowCount;
        return !isIdLike && !isFullyUnique;
      });

      // First priority: columns with churn-like names
      const churnLikeCol = validTargetColumns.find((col: string) =>
        /churn|target|label|yes_no|binary/.test(col.toLowerCase())
      );

      // Second priority: numeric columns
      const numericCol = !churnLikeCol ? validTargetColumns.find((col: string) => {
        const colAnalysis = data.columnAnalysis.find((c: { name: string }) => c.name === col);
        return colAnalysis?.type === 'numeric';
      }) : null;

      const selectedCol = churnLikeCol || numericCol;
      if (selectedCol) {
        setTargetColumn(selectedCol);
        // Validate the auto-selected column
        const colAnalysis = data.columnAnalysis.find((c: { name: string }) => c.name === selectedCol);
        const uniqueValues = colAnalysis?.uniqueValues || 0;
        const isBinary = uniqueValues === 2;
        const isHighCardinality = uniqueValues > 10 && colAnalysis?.type === 'numeric';

        if (isBinary) {
          setTargetValidation({ status: 'valid', message: `Auto-selected "${selectedCol}" as target (binary classification)` });
        } else if (isHighCardinality) {
          setTargetValidation({ status: 'continuous', message: `Auto-selected "${selectedCol}" (will convert to binary using median split)` });
        } else {
          setTargetValidation({ status: 'weak', message: `Auto-selected "${selectedCol}" (may have limited predictive power)` });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (!uploadResult || !targetColumn || !uploadResult.datasetValidation?.isValid) return;

    setTraining(true);
    setError(null);
    setPredictionResult(null);
    setDecisions(null);
    setChurnAnalysis(null);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: uploadResult.cleanedData,
          columns: uploadResult.columns,
          targetColumn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Training failed');
      }

      setTrainingResult(data);
      await handlePredict(data.bestModel, data.featureNames, data.encodingMaps, data.scalerParams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async (bestModel: BestModel, featureNames?: string[], encodingMaps?: Record<string, Record<string, number>>, scalerParams?: { mins: number[]; maxs: number[] }) => {
    if (!uploadResult || !targetColumn) return;

    setPredicting(true);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: uploadResult.cleanedData,
          columns: uploadResult.columns,
          targetColumn,
          modelType: bestModel.type,
          modelData: bestModel.modelData,
          encodingMaps,
          scalerParams,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Prediction failed');
      }

      setPredictionResult({
        ...data.predictions,
        summary: data.summary,
      });

      await handleDecide(data.predictions, data.summary, bestModel.modelData?.featureImportances, featureNames || uploadResult.columns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleDecide = async (
    predictions: PredictionResult,
    summary: PredictionResult['summary'],
    featureImportances?: number[],
    featureNames?: string[]
  ) => {
    setDeciding(true);

    try {
      const res = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions,
          summary,
          featureImportances: featureImportances || trainingResult?.bestModel.modelData?.featureImportances,
          featureNames: featureNames || trainingResult?.featureNames,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Decision generation failed');
      }

      setChurnAnalysis(data.churnAnalysis);
      setDecisions(data.decisions);

      const baselineMetrics = calculateBaseline(
        data.churnAnalysis,
        uploadResult?.cleanedRowCount || 0
      );
      setBaseline(baselineMetrics);

      // Build chat context (preserve datasetInfo from upload)
      setChatContext(prev => ({
        ...prev,
        datasetInfo: prev?.datasetInfo,
        churnRate: baselineMetrics.churnRate,
        highRiskCount: data.churnAnalysis.highRiskCount,
        mediumRiskCount: data.churnAnalysis.mediumRiskCount,
        lowRiskCount: data.churnAnalysis.lowRiskCount,
        topDrivers: data.churnAnalysis.churnRiskDrivers.slice(0, 5).map((d: { feature: string }) => d.feature),
        actions: data.decisions.top3Actions.map((a: ScoredAction) => ({ title: a.title, id: a.id })),
        segments: {
          highRisk: data.churnAnalysis.highRiskCount,
          mediumRisk: data.churnAnalysis.mediumRiskCount,
          lowRisk: data.churnAnalysis.lowRiskCount,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision generation failed');
    } finally {
      setDeciding(false);
    }
  };

  const handleSimulate = useCallback(async (action: ScoredAction) => {
    if (!baseline) return;

    setSelectedAction(action);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, baseline }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      setSimulationResult(data.simulation);
      setSimulationActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    }
  }, [baseline]);

  const handleResetSimulation = useCallback(() => {
    setSelectedAction(null);
    setSimulationResult(null);
    setSimulationActive(false);
  }, []);

  const handleApplySimulation = useCallback(() => {
    setSimulationActive(true);
  }, []);

  const handleAskAbout = useCallback((action: ScoredAction, context?: string) => {
    if (chatContext) {
      setChatContext({
        ...chatContext,
        chartData: context ? {
          type: 'action',
          description: context,
        } : undefined,
      });
    }
    setIsChatOpen(true);
  }, [chatContext]);

  const handleChartAsk = useCallback((context: { chartType: string; feature?: string; value?: number; description?: string }) => {
    setChartContext(context);
    if (chatContext) {
      setChatContext({
        ...chatContext,
        chartData: {
          type: context.chartType,
          feature: context.feature,
          value: context.value,
          description: context.description,
        },
      });
    }
    setIsChatOpen(true);
  }, [chatContext]);

  const isProcessing = loading || training || predicting || deciding;
  const analysisReady = uploadResult && datasetValidation?.isValid && trainingResult && predictionResult && decisions && churnAnalysis;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">DataLens</h1>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardContent >
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setDatasetValidation(null);
              }}
              className="block flex-1 min-w-48 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card className='mb-6'>
          <CardContent>
            <div className="flex items-center gap-3">
              <Spinner />
              <span className="text-sm text-muted-foreground">
                {loading && 'Parsing dataset...'}
                {training && 'Training models...'}
                {predicting && 'Running predictions...'}
                {deciding && 'Generating decisions...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadResult && (
        <>
          {/* Dataset Validation - BLOCKS PIPELINE */}
          {uploadResult.datasetValidation && !uploadResult.datasetValidation.isValid && (
            <DatasetValidator validation={uploadResult.datasetValidation} onReset={handleReset} />
          )}

          {/* Dropped Columns Alert */}
          {uploadResult.droppedColumns.length > 0 && (
            <Card className="mb-6 border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">
                  Dropped {uploadResult.droppedColumns.length} invalid column(s)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {uploadResult.droppedColumns.map((col: { name: string; reason: string }) => (
                    <Badge key={col.name} variant="outline" title={col.reason}>
                      {col.name || '(empty)'} - {col.reason}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Columns</p>
                <p className="text-2xl font-bold">{uploadResult.columns.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Clean Rows</p>
                <p className="text-2xl font-bold">{uploadResult.cleanedRowCount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Dataset Valid</p>
                <p className="text-2xl font-bold">{datasetValidation?.isValid ? 'Yes' : 'No'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">{analysisReady ? 'Ready' : 'Pending'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Training Section - Only show if dataset is valid */}
          {datasetValidation?.isValid && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Model Training</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Target Column:</label>
                    <Select value={targetColumn} onValueChange={(val) => {
                      const col = val || '';
                      setTargetColumn(col);
                      validateTarget(col);
                    }}>
                      <SelectTrigger className="w-50">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadResult.columns
                          .filter((col: string) => {
                            const idPatterns = ['id', 'customer_id', 'uuid', 'guid', 'index', 'serial'];
                            const lowerCol = col.toLowerCase();
                            const isIdLike = idPatterns.some(p => lowerCol.includes(p));
                            const colAnalysis = uploadResult.columnAnalysis.find((c: { name: string }) => c.name === col);
                            const isFullyUnique = colAnalysis && colAnalysis.uniqueValues === uploadResult.cleanedRowCount;
                            return !isIdLike && !isFullyUnique;
                          })
                          .map((col: string) => {
                            const isChurnLike = /churn|target|label|yes_no|binary/.test(col.toLowerCase());
                            return (
                              <SelectItem key={col} value={col}>
                                {col}
                                {isChurnLike && ' (recommended)'}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleTrain}
                    disabled={!targetColumn || targetValidation.status === 'invalid' || isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Train & Predict'}
                  </Button>
                </div>

                {/* Target Validation Message */}
                {targetColumn && targetValidation.status !== 'idle' && (
                  <div className={`text-sm mb-4 p-3 rounded-md ${
                    targetValidation.status === 'valid' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                    targetValidation.status === 'weak' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                    targetValidation.status === 'continuous' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                    targetValidation.status === 'invalid' ? 'bg-destructive/10 text-destructive border border-destructive/30' :
                    'bg-muted'
                  }`}>
                    <p className="font-medium">{targetValidation.message}</p>
                  </div>
                )}

                {trainingResult && (
                  <>
                    {/* Best Model */}
                    <Card className="mb-6 border-green-500/50 bg-green-500/5">
                      <CardHeader>
                        <CardTitle className="text-green-400">
                          Best Model: {trainingResult.bestModel.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                            <p className="text-xl font-bold">{(trainingResult.bestModel.evaluation.accuracy * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">F1 Score</p>
                            <p className="text-xl font-bold text-yellow-400">{(trainingResult.bestModel.evaluation.f1 * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Precision</p>
                            <p className="text-xl font-bold">{(trainingResult.bestModel.evaluation.precision * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Recall</p>
                            <p className="text-xl font-bold">{(trainingResult.bestModel.evaluation.recall * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* TOP 3 ACTIONS - PRIMARY DISPLAY */}
          {decisions && churnAnalysis && (
            <>
              <ActionSection
                top3Actions={decisions.top3Actions}
                churnAnalysis={churnAnalysis}
                onSimulate={handleSimulate}
                onAskAbout={handleAskAbout}
              />

              <Separator className="my-8" />

              {/* SIMULATION SECTION */}
              {selectedAction && baseline && (
                <div className="mb-8">
                  <SimulationSection
                    action={selectedAction}
                    baseline={baseline}
                    simulatedResult={simulationResult || undefined}
                    onSimulate={() => handleSimulate(selectedAction)}
                    onReset={handleResetSimulation}
                    onApply={handleApplySimulation}
                  />
                </div>
              )}

              <Separator className="my-8" />

              {/* EVIDENCE CHARTS - Interactive with hover */}
              <EvidenceCharts
                riskDistribution={predictionResult ? {
                  highRisk: predictionResult.summary.highRisk,
                  mediumRisk: predictionResult.summary.mediumRisk,
                  lowRisk: predictionResult.summary.lowRisk,
                } : undefined}
                featureImportances={churnAnalysis.churnRiskDrivers}
                onAskAbout={handleChartAsk}
                simulationActive={simulationActive}
                simulatedMetrics={simulationResult ? {
                  highRisk: Math.round(predictionResult!.summary.highRisk * (simulationResult.after.atRiskCustomers / (baseline?.atRiskCustomers || 1))),
                  mediumRisk: Math.round(predictionResult!.summary.mediumRisk * 0.9),
                  lowRisk: Math.round(predictionResult!.summary.lowRisk * 1.1),
                } : undefined}
              />

              <Separator className="my-8" />
            </>
          )}

          {/* Prediction Summary */}
          {predictionResult && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Prediction Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="original" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="original" className="gap-2">
                      <BarChartIcon className="size-4" />
                      Original
                    </TabsTrigger>
                    {simulationResult && (
                      <TabsTrigger value="simulated" className="gap-2">
                        <PieChartIcon className="size-4" />
                        Simulated
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="original">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-400">{predictionResult.summary.highRisk}</p>
                        <p className="text-xs text-muted-foreground">High Risk</p>
                        <p className="text-xs text-red-300">{predictionResult.summary.highRiskPercent.toFixed(1)}%</p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{predictionResult.summary.mediumRisk}</p>
                        <p className="text-xs text-muted-foreground">Medium Risk</p>
                        <p className="text-xs text-yellow-300">{predictionResult.summary.mediumRiskPercent.toFixed(1)}%</p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{predictionResult.summary.lowRisk}</p>
                        <p className="text-xs text-muted-foreground">Low Risk</p>
                        <p className="text-xs text-green-300">{predictionResult.summary.lowRiskPercent.toFixed(1)}%</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-400">{(predictionResult.summary.avgProbability * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Avg Probability</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center col-span-2">
                        <p className="text-2xl font-bold text-purple-400">{predictionResult.summary.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Customers</p>
                      </div>
                    </div>
                  </TabsContent>
                  {simulationResult && (
                    <TabsContent value="simulated">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center ring-2 ring-primary">
                          <p className="text-2xl font-bold text-red-400">{simulationResult.delta.atRiskCustomers < 0 ? '+' : ''}{Math.abs(simulationResult.after.atRiskCustomers)}</p>
                          <p className="text-xs text-muted-foreground">High Risk</p>
                          <p className="text-xs text-green-300">{simulationResult.delta.churnRate.toFixed(1)}%</p>
                        </div>
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-yellow-400">-</p>
                          <p className="text-xs text-muted-foreground">Medium Risk</p>
                          <p className="text-xs text-muted-foreground">-</p>
                        </div>
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-400">-</p>
                          <p className="text-xs text-muted-foreground">Low Risk</p>
                          <p className="text-xs text-muted-foreground">-</p>
                        </div>
                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-400">{(baseline?.churnRate || 0) + simulationResult.delta.churnRate}%</p>
                          <p className="text-xs text-muted-foreground">New Churn Rate</p>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <Badge variant="default" className="text-sm px-4 py-2">Simulation Applied</Badge>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Dataset Charts */}
          <DatasetCharts uploadResult={uploadResult} />

          {/* Data Preview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Cleaned Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      {uploadResult.columns.map((col: string) => (
                        <th key={col} className="border px-4 py-2 text-left text-sm font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.cleanedPreview.slice(0, 5).map((row: Record<string, string>, i: number) => (
                      <tr key={i}>
                        {uploadResult.columns.map((col: string) => (
                          <td key={col} className="border px-4 py-2 text-sm">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={chatContext || undefined}
        chartContext={chartContext || undefined}
      />
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg z-30"
        aria-label="Open chat"
      >
        <MessageSquareIcon className="size-6" />
      </Button>
    </div>
  );
}