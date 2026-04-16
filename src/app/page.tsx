'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    columns: string[];
    rowCount: number;
    preview: Record<string, string>[];
  } | null>(null);
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

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-8">
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
        <div className="bg-white/10 border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">CSV Analysis Complete</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-500 p-4 rounded">
              <p className="text-sm text-gray-600">Columns</p>
              <p className="text-2xl font-bold">{result.columns.length}</p>
            </div>
            <div className="bg-green-500 p-4 rounded">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold">{result.rowCount.toLocaleString()}</p>
            </div>
          </div>

          <h3 className="font-semibold mb-2">Column Names:</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {result.columns.map((col) => (
              <span key={col} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                {col}
              </span>
            ))}
          </div>

          <h3 className="font-semibold mb-2">Preview (first 5 rows):</h3>
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
                {result.preview.map((row, i) => (
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
      )}
    </div>
  );
}
