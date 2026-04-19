import { DecisionTree } from '@/types';

export interface PredictionResult {
  probabilities: number[];
  predictions: number[];
  riskLevels: ('high' | 'medium' | 'low')[];
}

export function predict(
  modelData: {
    type: string;
    weights?: number[];
    featureImportances?: number[];
    trees?: DecisionTree[];
  },
  features: number[][]
): PredictionResult {
  const probabilities: number[] = [];
  const predictions: number[] = [];
  const riskLevels: ('high' | 'medium' | 'low')[] = [];

  for (const featureRow of features) {
    const prob = predictProbability(modelData, featureRow);
    probabilities.push(prob);
    predictions.push(prob >= 0.5 ? 1 : 0);
    riskLevels.push(getRiskLevel(prob));
  }

  return { probabilities, predictions, riskLevels };
}

function predictProbability(
  modelData: {
    type: string;
    weights?: number[];
    featureImportances?: number[];
    trees?: DecisionTree[];
  },
  features: number[]
): number {
  // Logistic Regression
  if (modelData.weights && modelData.weights.length > 0) {
    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      sum += features[i] * (modelData.weights[i] || 0);
    }
    return sigmoid(sum);
  }

  // Tree-based models with actual trees - use tree traversal
  if (modelData.trees && modelData.trees.length > 0) {
    const votes: number[] = [];
    for (const tree of modelData.trees) {
      votes.push(predictTree(tree, features));
    }
    // Average probability across all trees
    return votes.reduce((sum, v) => sum + v, 0) / votes.length;
  }

  // Fallback: use feature importances as weighted sum
  if (modelData.featureImportances && modelData.featureImportances.length > 0) {
    let score = 0;
    for (let i = 0; i < features.length; i++) {
      score += features[i] * (modelData.featureImportances[i] || 0);
    }
    const maxPossible = modelData.featureImportances.reduce((sum, imp) => sum + imp, 0);
    if (maxPossible > 0) {
      return Math.min(1, Math.max(0, score / maxPossible));
    }
  }

  return 0.5;
}

function predictTree(tree: DecisionTree, features: number[]): number {
  if (tree.prediction !== undefined) {
    return tree.prediction;
  }

  if (features[tree.featureIndex] <= tree.threshold) {
    return tree.left ? predictTree(tree.left, features) : 0;
  } else {
    return tree.right ? predictTree(tree.right, features) : 0;
  }
}

function sigmoid(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}

function getRiskLevel(probability: number): 'high' | 'medium' | 'low' {
  if (probability >= 0.7) return 'high';
  if (probability >= 0.4) return 'medium';
  return 'low';
}
