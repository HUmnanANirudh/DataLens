import { ColumnAnalysis, PreprocessResult } from '@/types';

export function analyzeColumns(
  columns: string[],
  data: Record<string, string>[]
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

    if (nonEmptyValues.length > 0) {
      const allNumeric = sample.every((v) => numericPattern.test(v));
      const allDates = sample.every((v) => datePattern.test(v));

      if (allNumeric) {
        type = 'numeric';
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
    });

    cleanedColumns.push(col);
  }
  const cleanedData = data.filter((row) => {
    return cleanedColumns.some((col) => row[col]?.trim() !== '');
  });

  return {
    cleanedColumns,
    cleanedData,
    columnAnalysis,
    droppedColumns,
  };
}
