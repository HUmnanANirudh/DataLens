import { Dataset, TrainedModel, DecisionTree } from '@/types';
import { evaluateModel, predictByThreshold } from './evaluation';

export function trainBagging(
  trainData: Dataset,
  testData: Dataset,
  numClassifiers = 10,
  maxDepth = 5
): TrainedModel {
  const { features, labels, featureNames } = trainData;
  const trees: DecisionTree[] = [];

  // Bootstrap aggregating - train multiple decision trees on different samples
  for (let i = 0; i < numClassifiers; i++) {
    // Create bootstrap sample
    const { sampledFeatures, sampledLabels } = bootstrapSample(features, labels);

    // Build a decision tree (using simplified CART-like approach)
    const tree = buildDecisionTree(sampledFeatures, sampledLabels, 0, maxDepth);
    trees.push(tree);
  }

  // Predict using majority voting
  const probabilities = predictWithBagging(trees, testData.features);
  const predictions = predictByThreshold(probabilities);
  const evaluation = evaluateModel(predictions, testData.labels);

  // Calculate feature importance (simplified - based on how often features are used)
  const featureImportances = calculateFeatureImportance(trees, featureNames.length);

  return {
    config: {
      name: 'Bagging',
      type: 'bagging',
    },
    evaluation,
    trees,
    featureImportances,
  };
}

function bootstrapSample(
  features: number[][],
  labels: number[]
): {
  sampledFeatures: number[][];
  sampledLabels: number[];
} {
  const n = features.length;
  const sampledFeatures: number[][] = [];
  const sampledLabels: number[] = [];

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    sampledFeatures.push(features[idx]);
    sampledLabels.push(labels[idx]);
  }

  return { sampledFeatures, sampledLabels };
}

function buildDecisionTree(
  features: number[][],
  labels: number[],
  depth: number,
  maxDepth: number
): DecisionTree {
  // Stopping criteria
  if (depth >= maxDepth || labels.length < 5 || allSame(labels)) {
    return {
      featureIndex: -1,
      threshold: 0,
      prediction: majorityClass(labels),
    };
  }

  // Find best split
  const numFeatures = features[0].length;
  let bestGini = Infinity;
  let bestSplit: { featureIndex: number; threshold: number } | null = null;

  for (let f = 0; f < numFeatures; f++) {
    const values = features.map((row) => row[f]);
    const thresholds = findUniqueThresholds(values);

    for (const threshold of thresholds) {
      const gini = calculateGini(features, labels, f, threshold);
      if (gini < bestGini) {
        bestGini = gini;
        bestSplit = { featureIndex: f, threshold };
      }
    }
  }

  if (!bestSplit) {
    return {
      featureIndex: -1,
      threshold: 0,
      prediction: majorityClass(labels),
    };
  }

  // Split data
  const { leftFeatures, leftLabels, rightFeatures, rightLabels } = splitData(
    features,
    labels,
    bestSplit.featureIndex,
    bestSplit.threshold
  );

  // Recursively build subtrees
  const left = buildDecisionTree(leftFeatures, leftLabels, depth + 1, maxDepth);
  const right = buildDecisionTree(rightFeatures, rightLabels, depth + 1, maxDepth);

  return {
    featureIndex: bestSplit.featureIndex,
    threshold: bestSplit.threshold,
    left,
    right,
  };
}

function allSame(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[0]) return false;
  }
  return true;
}

function majorityClass(labels: number[]): number {
  const counts = [0, 0];
  for (const label of labels) {
    counts[label]++;
  }
  return counts[0] >= counts[1] ? 0 : 1;
}

function findUniqueThresholds(values: number[]): number[] {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const thresholds: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    thresholds.push((sorted[i] + sorted[i + 1]) / 2);
  }

  return thresholds;
}

function calculateGini(
  features: number[][],
  labels: number[],
  featureIndex: number,
  threshold: number
): number {
  const leftLabels: number[] = [];
  const rightLabels: number[] = [];

  for (let i = 0; i < features.length; i++) {
    if (features[i][featureIndex] <= threshold) {
      leftLabels.push(labels[i]);
    } else {
      rightLabels.push(labels[i]);
    }
  }

  const leftGini = giniImpurity(leftLabels);
  const rightGini = giniImpurity(rightLabels);

  const weightLeft = leftLabels.length / labels.length;
  const weightRight = rightLabels.length / labels.length;

  return weightLeft * leftGini + weightRight * rightGini;
}

function giniImpurity(labels: number[]): number {
  if (labels.length === 0) return 0;

  const counts = [0, 0];
  for (const label of labels) {
    counts[label]++;
  }

  let impurity = 1;
  for (const count of counts) {
    const p = count / labels.length;
    impurity -= p * p;
  }

  return impurity;
}

function splitData(
  features: number[][],
  labels: number[],
  featureIndex: number,
  threshold: number
): {
  leftFeatures: number[][];
  leftLabels: number[];
  rightFeatures: number[][];
  rightLabels: number[];
} {
  const leftFeatures: number[][] = [];
  const leftLabels: number[] = [];
  const rightFeatures: number[][] = [];
  const rightLabels: number[] = [];

  for (let i = 0; i < features.length; i++) {
    if (features[i][featureIndex] <= threshold) {
      leftFeatures.push(features[i]);
      leftLabels.push(labels[i]);
    } else {
      rightFeatures.push(features[i]);
      rightLabels.push(labels[i]);
    }
  }

  return { leftFeatures, leftLabels, rightFeatures, rightLabels };
}

function predictWithBagging(trees: DecisionTree[], features: number[][]): number[] {
  const predictions: number[] = [];

  for (const sample of features) {
    let votes = 0;
    for (const tree of trees) {
      votes += predictTree(tree, sample);
    }
    predictions.push(votes / trees.length);
  }

  return predictions;
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

function calculateFeatureImportance(trees: DecisionTree[], numFeatures: number): number[] {
  const importance = new Array(numFeatures).fill(0);

  for (const tree of trees) {
    countFeatureUsage(tree, importance);
  }

  // Normalize
  const total = importance.reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (let i = 0; i < importance.length; i++) {
      importance[i] /= total;
    }
  }

  return importance;
}

function countFeatureUsage(tree: DecisionTree, importance: number[]): void {
  if (tree.featureIndex === -1) return;

  importance[tree.featureIndex]++;
  if (tree.left) countFeatureUsage(tree.left, importance);
  if (tree.right) countFeatureUsage(tree.right, importance);
}
