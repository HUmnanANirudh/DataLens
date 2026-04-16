import { ModelEvaluation } from '@/types';

export function evaluateModel(predictions: number[], labels: number[]): ModelEvaluation {
  const tp = countMatches(predictions, labels, 1, 1);
  const tn = countMatches(predictions, labels, 0, 0);
  const fp = countMatches(predictions, labels, 1, 0);
  const fn = countMatches(predictions, labels, 0, 1);

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = (2 * (precision * recall)) / (precision + recall) || 0;

  return {
    accuracy,
    f1,
    precision,
    recall,
  };
}

function countMatches(
  predictions: number[],
  labels: number[],
  predVal: number,
  labelVal: number
): number {
  let count = 0;
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] === predVal && labels[i] === labelVal) {
      count++;
    }
  }
  return count;
}

export function predictByThreshold(probabilities: number[], threshold = 0.5): number[] {
  return probabilities.map((p) => (p >= threshold ? 1 : 0));
}
