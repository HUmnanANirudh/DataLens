export interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'empty';
  uniqueValues: number;
  nullCount: number;
  sample: string[];
}

export interface PreprocessResult {
  cleanedColumns: string[];
  cleanedData: Record<string, string>[];
  columnAnalysis: ColumnAnalysis[];
  droppedColumns: { name: string; reason: string }[];
}

export interface UploadResult {
  originalColumns: string[];
  columns: string[];
  rowCount: number;
  cleanedRowCount: number;
  preview: Record<string, string>[];
  cleanedPreview: Record<string, string>[];
  cleanedData: Record<string, string>[];
  columnAnalysis: ColumnAnalysis[];
  droppedColumns: { name: string; reason: string }[];
}

export interface UploadResult {
  columns: string[];
  rowCount: number;
  cleanedRowCount: number;
  columnAnalysis: ColumnAnalysis[];
  cleanedPreview: Record<string, string>[];
}

export interface DatasetChartsProps {
  uploadResult: UploadResult;
}