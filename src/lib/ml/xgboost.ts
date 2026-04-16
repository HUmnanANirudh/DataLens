import { Dataset, TrainedModel, DecisionTree } from '@/types/ml';
import { evaluateModel, predictByThreshold } from './evaluation';

interface XGBoostTree {
  tree: DecisionTree;
  weight: number;
}

export function trainXGBoost(
  trainData: Dataset,
  testData: Dataset,
  numTrees = 10,
  maxDepth = 3,
  learningRate = 0.1
): TrainedModel {
  const { features, labels } = trainData;
  const trees: XGBoostTree[] = [];

  // Initial prediction (log-odds for class 1)
  let currentPredictions = new Array(features.length).fill(0);

  for (let i = 0; i < numTrees; i++) {
    // Compute pseudo-residuals (gradient)
    const residuals = labels.map((label, idx) => {
      const prob = sigmoid(currentPredictions[idx]);
      return label - prob;
    });

    // Build a regression tree on residuals
    const tree = buildXGBoostTree(features, residuals, 0, maxDepth);

    // Compute leaf weights using simplified gain calculation
    const leafWeights = computeLeafWeights(tree, features, residuals);

    // Apply tree with learning rate
    const treePredictions = getTreePredictions(tree, features, leafWeights);

    for (let j = 0; j < features.length; j++) {
      currentPredictions[j] += learningRate * treePredictions[j];
    }

    trees.push({ tree, weight: learningRate });
  }

  // Final predictions on test data
  const testPredictions = predictWithXGBoost(trees, testData.features);
  const predictions = predictByThreshold(testPredictions);
  const evaluation = evaluateModel(predictions, testData.labels);

  return {
    config: {
      name: 'XGBoost',
      type: 'xgboost',
    },
    evaluation,
  };
}

function sigmoid(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}

function buildXGBoostTree(
  features: number[][],
  residuals: number[],
  depth: number,
  maxDepth: number
): DecisionTree {
  if (depth >= maxDepth || residuals.length < 5) {
    // Leaf node
    return {
      featureIndex: -1,
      threshold: 0,
      value: residuals.reduce((a, b) => a + b, 0) / residuals.length,
      prediction: residuals.reduce((a, b) => a + b, 0) / residuals.length > 0 ? 1 : 0,
    };
  }

  // Find best split to minimize squared error of residuals
  let bestReduction = -Infinity;
  let bestSplit: { featureIndex: number; threshold: number } | null = null;

  const numFeatures = features[0].length;

  for (let f = 0; f < numFeatures; f++) {
    const values = features.map((row) => row[f]);
    const thresholds = findUniqueThresholds(values);

    for (const threshold of thresholds) {
      const { leftResiduals, rightResiduals } = splitResiduals(features, residuals, f, threshold);

      if (leftResiduals.length === 0 || rightResiduals.length === 0) continue;

      const currentMSE = mse(residuals);
      const leftMSE = mse(leftResiduals);
      const rightMSE = mse(rightResiduals);

      const reduction =
        currentMSE -
        (leftResiduals.length / residuals.length) * leftMSE -
        (rightResiduals.length / residuals.length) * rightMSE;

      if (reduction > bestReduction) {
        bestReduction = reduction;
        bestSplit = { featureIndex: f, threshold };
      }
    }
  }

  if (!bestSplit || bestReduction <= 0) {
    return {
      featureIndex: -1,
      threshold: 0,
      value: residuals.reduce((a, b) => a + b, 0) / residuals.length,
      prediction: residuals.reduce((a, b) => a + b, 0) / residuals.length > 0 ? 1 : 0,
    };
  }

  const { leftFeatures, leftResiduals, rightFeatures, rightResiduals } = splitByFeature(
    features,
    residuals,
    bestSplit.featureIndex,
    bestSplit.threshold
  );

  return {
    featureIndex: bestSplit.featureIndex,
    threshold: bestSplit.threshold,
    left: buildXGBoostTree(leftFeatures, leftResiduals, depth + 1, maxDepth),
    right: buildXGBoostTree(rightFeatures, rightResiduals, depth + 1, maxDepth),
  };
}

function mse(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function findUniqueThresholds(values: number[]): number[] {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const thresholds: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    thresholds.push((sorted[i] + sorted[i + 1]) / 2);
  }

  return thresholds;
}

function splitResiduals(
  features: number[][],
  residuals: number[],
  featureIndex: number,
  threshold: number
): { leftResiduals: number[]; rightResiduals: number[] } {
  const leftResiduals: number[] = [];
  const rightResiduals: number[] = [];

  for (let i = 0; i < features.length; i++) {
    if (features[i][featureIndex] <= threshold) {
      leftResiduals.push(residuals[i]);
    } else {
      rightResiduals.push(residuals[i]);
    }
  }

  return { leftResiduals, rightResiduals };
}

function splitByFeature(
  features: number[][],
  residuals: number[],
  featureIndex: number,
  threshold: number
): {
  leftFeatures: number[][];
  leftResiduals: number[];
  rightFeatures: number[][];
  rightResiduals: number[];
} {
  const leftFeatures: number[][] = [];
  const leftResiduals: number[] = [];
  const rightFeatures: number[][] = [];
  const rightResiduals: number[] = [];

  for (let i = 0; i < features.length; i++) {
    if (features[i][featureIndex] <= threshold) {
      leftFeatures.push(features[i]);
      leftResiduals.push(residuals[i]);
    } else {
      rightFeatures.push(features[i]);
      rightResiduals.push(residuals[i]);
    }
  }

  return { leftFeatures, leftResiduals, rightFeatures, rightResiduals };
}

function computeLeafWeights(
  tree: DecisionTree,
  features: number[][],
  residuals: number[]
): Map<number, number> {
  const leafValues = new Map<number, number>();
  computeLeafValuesRecursive(tree, features, residuals, leafValues);
  return leafValues;
}

function computeLeafValuesRecursive(
  tree: DecisionTree,
  features: number[][],
  residuals: number[],
  leafValues: Map<number, number>
): void {
  if (tree.featureIndex === -1) {
    const leafId = getLeafId(tree);
    leafValues.set(leafId, residuals.reduce((a, b) => a + b, 0) / (residuals.length + 1));
    return;
  }

  if (tree.left) {
    const { leftFeatures, leftResiduals } = splitByFeature(
      features,
      residuals,
      tree.featureIndex,
      tree.threshold
    );
    computeLeafValuesRecursive(tree.left, leftFeatures, leftResiduals, leafValues);
  }

  if (tree.right) {
    const { rightFeatures, rightResiduals } = splitByFeature(
      features,
      residuals,
      tree.featureIndex,
      tree.threshold
    );
    computeLeafValuesRecursive(tree.right, rightFeatures, rightResiduals, leafValues);
  }
}

let leafCounter = 0;

function getLeafId(tree: DecisionTree): number {
  return leafCounter++;
}

function getTreePredictions(
  tree: DecisionTree,
  features: number[][],
  leafWeights: Map<number, number>
): number[] {
  leafCounter = 0;
  return features.map((f) => predictTreeValue(tree, f, leafWeights));
}

function predictTreeValue(
  tree: DecisionTree,
  features: number[],
  leafWeights: Map<number, number>
): number {
  if (tree.featureIndex === -1) {
    return leafWeights.get(getLeafId(tree)) || 0;
  }

  if (features[tree.featureIndex] <= tree.threshold) {
    return tree.left ? predictTreeValue(tree.left, features, leafWeights) : 0;
  } else {
    return tree.right ? predictTreeValue(tree.right, features, leafWeights) : 0;
  }
}

function predictWithXGBoost(trees: XGBoostTree[], features: number[][]): number[] {
  leafCounter = 0;
  const predictions = new Array(features.length).fill(0);

  for (const { tree, weight } of trees) {
    const leafWeights = new Map<number, number>();
    // Simplified: use average residual as leaf weight
    leafWeights.set(0, weight);

    for (let i = 0; i < features.length; i++) {
      predictions[i] += weight * predictTreeSingle(tree, features[i]);
    }
  }

  return predictions;
}

function predictTreeSingle(tree: DecisionTree, features: number[]): number {
  if (tree.featureIndex === -1) {
    return tree.value || 0;
  }

  if (features[tree.featureIndex] <= tree.threshold) {
    return tree.left ? predictTreeSingle(tree.left, features) : 0;
  } else {
    return tree.right ? predictTreeSingle(tree.right, features) : 0;
  }
}
