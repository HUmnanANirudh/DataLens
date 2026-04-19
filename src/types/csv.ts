export interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'empty';
  uniqueValues: number;
  nullCount: number;
  sample: string[];
  variance?: number;
}

export interface PreprocessResult {
  cleanedColumns: string[];
  cleanedData: Record<string, string>[];
  columnAnalysis: ColumnAnalysis[];
  droppedColumns: { name: string; reason: string }[];
}

export interface DatasetValidationResult {
  isValid: boolean;
  isCustomerDataset: boolean;
  score: number;
  reasons: string[];
  signals: {
    hasCustomerId: boolean;
    hasTarget: boolean;
    hasBehavior: boolean;
    hasTime: boolean;
  };
  suggestions: string[];
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
  datasetValidation?: DatasetValidationResult;
}

export interface DatasetChartsProps {
  uploadResult: UploadResult;
}