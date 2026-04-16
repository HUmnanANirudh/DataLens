import { Dataset, TrainedModel, DecisionTree } from '@/types/ml';
import { evaluateModel, predictByThreshold } from './evaluation';

export function trainRandomForest(
  trainData: Dataset,
  testData: Dataset,
  numTrees = 10,
  maxDepth = 5
): TrainedModel {
  const { features, labels, featureNames } = trainData;
  const trees: DecisionTree[] = [];
  const featureImportances = new Array(featureNames.length).fill(0);

  // Bootstrap sampling and tree building
  for (let i = 0; i < numTrees; i++) {
    // Bootstrap sample
    const { sampledFeatures, sampledLabels } = bootstrapSample(features, labels);

    // Build tree
    const tree = buildTree(sampledFeatures, sampledLabels, featureNames.length, 0, maxDepth);
    trees.push(tree);

    // Calculate feature importance for this tree
    const importance = calculateFeatureImportance(tree, featureNames.length);
    for (let j = 0; j < importance.length; j++) {
      featureImportances[j] += importance[j] / numTrees;
    }
  }

  // Predict on test data (majority vote)
  const probabilities = predictWithForest(trees, testData.features);
  const predictions = predictByThreshold(probabilities);
  const evaluation = evaluateModel(predictions, testData.labels);

  return {
    config: {
      name: 'Random Forest',
      type: 'random_forest',
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

function buildTree(
  features: number[][],
  labels: number[],
  numFeatures: number,
  depth: number,
  maxDepth: number
): DecisionTree {
  // Check stopping criteria
  if (depth >= maxDepth || labels.length < 5 || allSame(labels)) {
    return {
      featureIndex: -1,
      threshold: 0,
      prediction: majorityClass(labels),
    };
  }

  // Select random subset of features
  const featureIndices = selectRandomFeatures(numFeatures, Math.ceil(Math.sqrt(numFeatures)));

  // Find best split
  let bestGini = Infinity;
  let bestSplit: { featureIndex: number; threshold: number } | null = null;

  for (const idx of featureIndices) {
    const values = features.map((f) => f[idx]);
    const thresholds = findUniqueThresholds(values);

    for (const threshold of thresholds) {
      const split = evaluateSplit(features, labels, idx, threshold);
      if (split.gini < bestGini) {
        bestGini = split.gini;
        bestSplit = { featureIndex: idx, threshold };
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

  // Build subtrees
  const left = buildTree(leftFeatures, leftLabels, numFeatures, depth + 1, maxDepth);
  const right = buildTree(rightFeatures, rightLabels, numFeatures, depth + 1, maxDepth);

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

function selectRandomFeatures(numFeatures: number, m: number): number[] {
  const indices: number[] = [];
  const available = [...Array(numFeatures).keys()];

  for (let i = 0; i < Math.min(m, numFeatures); i++) {
    const idx = Math.floor(Math.random() * available.length);
    indices.push(available[idx]);
    available.splice(idx, 1);
  }

  return indices;
}

function findUniqueThresholds(values: number[]): number[] {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const thresholds: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    thresholds.push((sorted[i] + sorted[i + 1]) / 2);
  }

  return thresholds;
}

function evaluateSplit(
  features: number[][],
  labels: number[],
  featureIndex: number,
  threshold: number
): { gini: number; leftLabels: number[]; rightLabels: number[] } {
  const leftLabels: number[] = [];
  const rightLabels: number[] = [];

  for (let i = 0; i < features.length; i++) {
    if (features[i][featureIndex] <= threshold) {
      leftLabels.push(labels[i]);
    } else {
      rightLabels.push(labels[i]);
    }
  }

  const gini = (leftLabels.length / labels.length) * giniImpurity(leftLabels) +
    (rightLabels.length / labels.length) * giniImpurity(rightLabels);

  return { gini, leftLabels, rightLabels };
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

function calculateFeatureImportance(tree: DecisionTree, numFeatures: number): number[] {
  const importance = new Array(numFeatures).fill(0);
  calculateImportanceRecursive(tree, importance);
  return importance;
}

function calculateImportanceRecursive(tree: DecisionTree, importance: number[]): void {
  if (tree.featureIndex === -1) return;

  importance[tree.featureIndex]++;
  if (tree.left) calculateImportanceRecursive(tree.left, importance);
  if (tree.right) calculateImportanceRecursive(tree.right, importance);
}

function predictWithForest(trees: DecisionTree[], features: number[][]): number[] {
  const predictions: number[] = [];

  for (const sample of features) {
    const votes = [0, 0];
    for (const tree of trees) {
      const pred = predictTree(tree, sample);
      votes[pred]++;
    }
    predictions.push(votes[1] / trees.length);
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
