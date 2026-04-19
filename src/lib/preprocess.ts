import { ColumnAnalysis, PreprocessResult } from '@/types';

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

export function analyzeColumns(
  columns: string[],
  data: Record<string, string>[],
  targetColumn?: string
): PreprocessResult {
  const droppedColumns: { name: string; reason: string }[] = [];
  const columnAnalysis: ColumnAnalysis[] = [];
  const cleanedColumns: string[] = [];

  for (const col of columns) {
    const values = data.map((row) => row[col]?.trim() ?? '');
    const nonEmptyValues = values.filter((v) => v !== '');
    const nullCount = values.length - nonEmptyValues.length;
    const uniqueValues = new Set(nonEmptyValues).size;

    // Check if column is empty (all values are empty)
    if (nonEmptyValues.length === 0) {
      droppedColumns.push({ name: col, reason: 'Column is empty (no data)' });
      continue;
    }

    // Check if column name is empty or starts with underscore (malformed header)
    if (col === '' || col.startsWith('_')) {
      droppedColumns.push({ name: col, reason: 'Invalid column name' });
      continue;
    }

    // Determine type
    let type: 'numeric' | 'categorical' | 'date' = 'categorical';
    const numericPattern = /^-?\d+\.?\d*$/;
    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;

    const sample = nonEmptyValues.slice(0, 10);
    let variance: number | undefined;

    if (nonEmptyValues.length > 0) {
      const allNumeric = sample.every((v) => numericPattern.test(v));
      const allDates = sample.every((v) => datePattern.test(v));

      if (allNumeric) {
        type = 'numeric';
        // Calculate variance for numeric columns
        const numericValues = nonEmptyValues.map(Number).filter(n => !isNaN(n));
        variance = calculateVariance(numericValues);
      } else if (allDates) {
        type = 'date';
      }
    }

    columnAnalysis.push({
      name: col,
      type,
      uniqueValues,
      nullCount,
      sample: sample.slice(0, 5),
      variance,
    });

    cleanedColumns.push(col);
  }

  // Filter rows: keep only rows where at least one cleaned column has data
  // AND if targetColumn is specified, that column must have data
  const cleanedData = data.filter((row) => {
    const hasData = cleanedColumns.some((col) => row[col]?.trim() !== '');
    const hasTarget = !targetColumn || row[targetColumn]?.trim() !== '';
    return hasData && hasTarget;
  });

  return {
    cleanedColumns,
    cleanedData,
    columnAnalysis,
    droppedColumns,
  };
}
