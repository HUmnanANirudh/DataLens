'use client';

import { useState } from 'react';
import { UploadResult} from '@/types';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

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

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">DataLens - CSV Upload</h1>

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

      {result && (
        <>
          {result.droppedColumns.length > 0 && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-400 mb-2">
                Dropped {result.droppedColumns.length} invalid column(s)
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.droppedColumns.map((col) => (
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
              <p className="text-2xl font-bold">{result.originalColumns.length}</p>
            </div>
            <div className="bg-green-500 p-4 rounded">
              <p className="text-sm text-gray-600">Cleaned Columns</p>
              <p className="text-2xl font-bold">{result.columns.length}</p>
            </div>
            <div className="bg-blue-500 p-4 rounded">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold">{result.rowCount.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 p-4 rounded">
              <p className="text-sm text-gray-600">Cleaned Rows</p>
              <p className="text-2xl font-bold">{result.cleanedRowCount.toLocaleString()}</p>
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
                  {result.columnAnalysis.map((col) => (
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

          {/* Cleaned Data Preview */}
          <div className="bg-white/10 border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cleaned Data Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col} className="border px-4 py-2 text-left text-sm">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.cleanedPreview.map((row, i) => (
                    <tr key={i}>
                      {result.columns.map((col) => (
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
