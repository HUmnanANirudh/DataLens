export interface Dataset {
  features: number[][];
  labels: number[];
  featureNames: string[];
}

export interface ModelConfig {
  name: string;
  type: 'logistic_regression' | 'random_forest' | 'xgboost' | 'bagging';
}

export interface ModelEvaluation {
  accuracy: number;
  f1: number;
  precision: number;
  recall: number;
}

export interface TrainedModel {
  config: ModelConfig;
  evaluation: ModelEvaluation;
  featureImportances?: number[];
  weights?: number[];
  trees?: DecisionTree[];
}

export interface DecisionTree {
  featureIndex: number;
  threshold: number;
  left?: DecisionTree;
  right?: DecisionTree;
  prediction?: number;
  value?: number;
}

export interface XGBoostTree {
  tree: DecisionTree;
  weight: number;
}

export interface ModelData {
  weights?: number[];
  trees?: DecisionTree[];
  featureImportances?: number[];
}

export interface ModelSelectionResult {
  bestModel: TrainedModel;
  allModels: TrainedModel[];
  leaderboard: { name: string; f1: number }[];
}

export type TrainRequest = {
  data: Record<string, string>[];
  columns: string[];
  targetColumn: string;
};

export interface ModelResult {
  name: string;
  type: string;
  evaluation: ModelEvaluation;
  modelData?: ModelData;
}

export interface TrainingResult {
  success: boolean;
  leaderboard: { name: string; f1: number }[];
  bestModel: ModelResult;
  totalModels: number;
  encodingMaps?: Record<string, Record<string, number>>;
  scalerParams?: { mins: number[]; maxs: number[] };
}

export interface ModelChartsProps {
  trainingResult: TrainingResult;
  columns: string[];
}

export interface BestModel {
  name: string;
  type: string;
  evaluation: { accuracy: number; f1: number; precision: number; recall: number };
  modelData?: ModelData;
}

export interface EncodingMaps {
  [column: string]: { [value: string]: number };
}

export interface ScalerParams {
  mins: number[];
  maxs: number[];
}