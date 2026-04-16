import { ChurnAnalysis, TrainedModel, Dataset } from '@/types';

export function analyzeChurn(model: TrainedModel, dataset: Dataset): ChurnAnalysis {
  const { features, featureNames } = dataset;

  // Get predictions from the model
  const probabilities = getProbabilities(model, features);

  // Classify risk levels
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] >= 0.7) {
      highRiskCount++;
    } else if (probabilities[i] >= 0.4) {
      mediumRiskCount++;
    } else {
      lowRiskCount++;
    }
  }

  const total = probabilities.length;

  // Get feature importances
  const featureImportances = model.featureImportances || [];

  // Map feature importances to feature names
  const churnRiskDrivers = featureNames
    .map((name, index) => ({
      feature: name,
      importance: featureImportances[index] || 0,
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    highRiskCount,
    highRiskPercentage: (highRiskCount / total) * 100,
    mediumRiskCount,
    mediumRiskPercentage: (mediumRiskCount / total) * 100,
    lowRiskCount,
    churnRiskDrivers,
  };
}

function getProbabilities(model: TrainedModel, features: number[][]): number[] {
  // Simple prediction based on model type
  // For all models, we return a probability-like score
  if (model.weights && model.weights.length > 0) {
    // Logistic Regression
    return features.map(f => {
      let sum = 0;
      for (let i = 0; i < f.length; i++) {
        sum += f[i] * (model.weights?.[i] || 0);
      }
      return sigmoid(sum);
    });
  }

  // For tree-based models, use feature importances as a rough guide
  if (model.featureImportances && model.featureImportances.length > 0) {
    return features.map(f => {
      let score = 0;
      for (let i = 0; i < f.length; i++) {
        // Higher feature values with high importance contribute to risk
        score += f[i] * (model.featureImportances?.[i] || 0);
      }
      return Math.min(1, Math.max(0, score));
    });
  }

  // Default: random distribution based on class balance
  return features.map(() => 0.5);
}

function sigmoid(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}
