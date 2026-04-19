'use client';

import { useState } from 'react';
import { UploadResult, TrainingResult, DecisionEngineResult, ChurnAnalysis, Action, BaselineMetrics, PredictionResult } from '@/types';
import { ModelCharts } from '@/components/ModelCharts';
import { DatasetCharts } from '@/components/DatasetCharts';
import { Decisions, SimulationModal } from '@/components/decisions';
import { calculateBaseline } from '@/lib/decisions/simulation';
import { ChatBot } from '@/components/ChatBot';
import { MessageSquareIcon } from 'lucide-react';
import { BestModel } from '@/types';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Training state
  const [targetColumn, setTargetColumn] = useState<string>('');
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
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setTrainingResult(null);
    setPredictionResult(null);
    setDecisions(null);
    setChurnAnalysis(null);

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
      const numericCol = data.columnAnalysis.find((c: { type: string }) => c.type === 'numeric');
      if (numericCol) {
        setTargetColumn(numericCol.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (!uploadResult || !targetColumn) return;

    setTraining(true);
    setError(null);
    setPredictionResult(null);
    setDecisions(null);
    setChurnAnalysis(null);

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

      // Automatically run prediction
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

      // Automatically run decision engine with both predictions and summary
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

      // Calculate baseline for simulation
      const baselineMetrics = calculateBaseline(
        data.churnAnalysis,
        uploadResult?.cleanedRowCount || 0
      );
      setBaseline(baselineMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision generation failed');
    } finally {
      setDeciding(false);
    }
  };

  const handleSimulate = (action: Action) => {
    setSelectedAction(action);
  };

  const closeSimulation = () => {
    setSelectedAction(null);
  };

  const isProcessing = loading || training || predicting || deciding;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">DataLens - AI Growth Strategy Engine</h1>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 mb-8">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? 'Processing...' : 'Upload & Analyze'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          {error}
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-blue-300">
              {training && 'Training models...'}
              {predicting && 'Running predictions...'}
              {deciding && 'Generating decisions...'}
            </span>
          </div>
        </div>
      )}

      {uploadResult && (
        <>
          {/* Dropped Columns Alert */}
          {uploadResult.droppedColumns.length > 0 && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-400 mb-2">
                Dropped {uploadResult.droppedColumns.length} invalid column(s)
              </h3>
              <div className="flex flex-wrap gap-2">
                {uploadResult.droppedColumns.map((col: { name: string; reason: string }) => (
                  <span
                    key={col.name}
                    className="px-3 py-1 bg-red-900/50 rounded-full text-sm text-red-300"
                    title={col.reason}
                  >
                    {col.name || '(empty)'} - {col.reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500 p-4 rounded">
              <p className="text-sm text-gray-600">Columns</p>
              <p className="text-2xl font-bold">{uploadResult.columns.length}</p>
            </div>
            <div className="bg-green-500 p-4 rounded">
              <p className="text-sm text-gray-600">Clean Rows</p>
              <p className="text-2xl font-bold">{uploadResult.cleanedRowCount.toLocaleString()}</p>
            </div>
            <div className="bg-purple-500 p-4 rounded">
              <p className="text-sm text-gray-600">Prediction Status</p>
              <p className="text-2xl font-bold">{predictionResult ? 'Ready' : 'Pending'}</p>
            </div>
            <div className="bg-yellow-500 p-4 rounded">
              <p className="text-sm text-gray-600">Actions</p>
              <p className="text-2xl font-bold">{decisions ? 'Generated' : 'Pending'}</p>
            </div>
          </div>

          {/* Dataset Charts */}
          <DatasetCharts uploadResult={uploadResult} />

          {/* Training Section */}
          <div className="bg-white/10 border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Model Training</h2>

            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm">Target Column:</label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="">Select target</option>
                {uploadResult.columns.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>

              <button
                onClick={handleTrain}
                disabled={!targetColumn || isProcessing}
                className="px-6 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
              >
                {isProcessing ? 'Processing...' : 'Train & Predict'}
              </button>
            </div>

            {trainingResult && (
              <>
                {/* Best Model */}
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-400 mb-2">
                    Best Model: {trainingResult.bestModel.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Accuracy</p>
                      <p className="text-xl font-bold">{(trainingResult.bestModel.evaluation.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">F1 Score</p>
                      <p className="text-xl font-bold text-yellow-400">{(trainingResult.bestModel.evaluation.f1 * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Precision</p>
                      <p className="text-xl font-bold">{(trainingResult.bestModel.evaluation.precision * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Recall</p>
                      <p className="text-xl font-bold">{(trainingResult.bestModel.evaluation.recall * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <ModelCharts
                  trainingResult={trainingResult}
                  columns={uploadResult.columns}
                />
              </>
            )}
          </div>

          {/* Prediction Summary */}
          {predictionResult && (
            <div className="bg-white/10 border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Prediction Analysis</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{predictionResult.summary.highRisk}</p>
                  <p className="text-xs text-gray-400">High Risk</p>
                  <p className="text-xs text-red-300">{predictionResult.summary.highRiskPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{predictionResult.summary.mediumRisk}</p>
                  <p className="text-xs text-gray-400">Medium Risk</p>
                  <p className="text-xs text-yellow-300">{predictionResult.summary.mediumRiskPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{predictionResult.summary.lowRisk}</p>
                  <p className="text-xs text-gray-400">Low Risk</p>
                  <p className="text-xs text-green-300">{predictionResult.summary.lowRiskPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{(predictionResult.summary.avgProbability * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Avg Probability</p>
                </div>
                <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 text-center col-span-2">
                  <p className="text-2xl font-bold text-purple-400">{predictionResult.summary.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Total Customers</p>
                </div>
              </div>
            </div>
          )}

          {/* Decisions Section - TOP PRIORITY */}
          {decisions && churnAnalysis && (
            <Decisions
              decisions={decisions}
              churnAnalysis={churnAnalysis}
              onSimulate={handleSimulate}
            />
          )}

          {/* Data Preview */}
          <div className="bg-white/10 border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Cleaned Data Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr>
                    {uploadResult.columns.map((col: string) => (
                      <th key={col} className="border px-4 py-2 text-left text-sm">{col}</th>
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
          </div>
        </>
      )}

      {/* Simulation Modal */}
      {selectedAction && baseline && (
        <SimulationModal
          action={selectedAction}
          baseline={baseline}
          onClose={closeSimulation}
        />
      )}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg z-30 transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageSquareIcon className="size-6" />
      </button>
    </div>
  );
}
