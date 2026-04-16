'use client';

import { useState } from 'react';
import { UploadResult } from '@/types';
import { ModelCharts } from '@/components/ModelCharts';
import { DatasetCharts } from '@/components/DatasetCharts';

interface ModelResult {
  name: string;
  type: string;
  evaluation: {
    accuracy: number;
    f1: number;
    precision: number;
    recall: number;
  };
  featureImportances?: number[];
}

interface TrainingResult {
  success: boolean;
  leaderboard: { name: string; f1: number }[];
  bestModel: ModelResult;
  totalModels: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Training state
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [training, setTraining] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setTrainingResult(null);

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
      // Auto-select first numeric column as target
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

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
              <p className="text-sm text-gray-600">Original Columns</p>
              <p className="text-2xl font-bold">{uploadResult.originalColumns.length}</p>
            </div>
            <div className="bg-green-500 p-4 rounded">
              <p className="text-sm text-gray-600">Cleaned Columns</p>
              <p className="text-2xl font-bold">{uploadResult.columns.length}</p>
            </div>
            <div className="bg-blue-500 p-4 rounded">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold">{uploadResult.rowCount.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 p-4 rounded">
              <p className="text-sm text-gray-600">Cleaned Rows</p>
              <p className="text-2xl font-bold">{uploadResult.cleanedRowCount.toLocaleString()}</p>
            </div>
          </div>

          {/* Column Analysis */}
          <div className="bg-white/10 border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Column Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3">Column</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-right py-2 px-3">Unique</th>
                    <th className="text-right py-2 px-3">Nulls</th>
                    <th className="text-left py-2 px-3">Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.columnAnalysis.map((col: ColumnAnalysis) => (
                    <tr key={col.name} className="border-t border-white/10">
                      <td className="py-2 px-3 font-mono">{col.name}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            col.type === 'numeric'
                              ? 'bg-blue-500/30 text-blue-300'
                              : col.type === 'date'
                              ? 'bg-purple-500/30 text-purple-300'
                              : 'bg-gray-500/30 text-gray-300'
                          }`}
                        >
                          {col.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{col.uniqueValues.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{col.nullCount.toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono text-xs text-gray-400">
                        {col.sample.slice(0, 3).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Visualization Charts */}
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
                <option value="">Select target column</option>
                {uploadResult.columns.map((col: string) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              <button
                onClick={handleTrain}
                disabled={!targetColumn || training}
                className="px-6 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
              >
                {training ? 'Training...' : 'Train All Models'}
              </button>
            </div>

            {trainingResult && (
              <div>
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

                {/* Leaderboard */}
                <h4 className="font-semibold mb-3">Model Leaderboard</h4>
                <div className="space-y-2">
                  {trainingResult.leaderboard.map((model, idx) => (
                    <div
                      key={model.name}
                      className={`flex items-center justify-between p-3 rounded ${
                        idx === 0 ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                          idx === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>{model.name}</span>
                      </div>
                      <span className="font-mono">F1: {(model.f1 * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="mt-6">
                  <ModelCharts
                    trainingResult={trainingResult}
                    columns={uploadResult.columns}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cleaned Data Preview */}
          <div className="bg-white/10 border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cleaned Data Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr>
                    {uploadResult.columns.map((col: string) => (
                      <th key={col} className="border px-4 py-2 text-left text-sm">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.cleanedPreview.map((row: Record<string, string>, i: number) => (
                    <tr key={i}>
                      {uploadResult.columns.map((col: string) => (
                        <td key={col} className="border px-4 py-2 text-sm">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'empty';
  uniqueValues: number;
  nullCount: number;
  sample: string[];
}
