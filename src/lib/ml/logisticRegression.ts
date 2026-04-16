import { Dataset, TrainedModel } from '@/types';
import { evaluateModel, predictByThreshold } from './evaluation';

function sigmoid(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}

export function trainLogisticRegression(
  trainData: Dataset,
  testData: Dataset
): TrainedModel {
  const { features, labels } = trainData;
  const numFeatures = features[0].length;
  const numSamples = features.length;

  // Initialize weights to zeros
  const weights = new Array(numFeatures).fill(0);
  let bias = 0;

  // Hyperparameters
  const learningRate = 0.1;
  const iterations = 1000;

  // Gradient descent
  for (let iter = 0; iter < iterations; iter++) {
    // Compute predictions (forward pass)
    const predictions: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      let sum = bias;
      for (let j = 0; j < numFeatures; j++) {
        sum += features[i][j] * weights[j];
      }
      predictions.push(sigmoid(sum));
    }

    // Compute gradients
    const error = predictions.map((pred, i) => pred - labels[i]);

    // Update weights
    for (let j = 0; j < numFeatures; j++) {
      let gradient = 0;
      for (let i = 0; i < numSamples; i++) {
        gradient += error[i] * features[i][j];
      }
      weights[j] -= (learningRate / numSamples) * gradient;
    }

    // Update bias
    let biasGradient = 0;
    for (let i = 0; i < numSamples; i++) {
      biasGradient += error[i];
    }
    bias -= (learningRate / numSamples) * biasGradient;
  }

  // Get predictions on test data
  const testPredictions: number[] = [];
  for (let i = 0; i < testData.features.length; i++) {
    let sum = bias;
    for (let j = 0; j < numFeatures; j++) {
      sum += testData.features[i][j] * weights[j];
    }
    testPredictions.push(sigmoid(sum));
  }

  const predictions = predictByThreshold(testPredictions);
  const evaluation = evaluateModel(predictions, testData.labels);

  return {
    config: {
      name: 'Logistic Regression',
      type: 'logistic_regression',
    },
    evaluation,
    weights,
  };
}

export function predictWithLR(
  model: TrainedModel,
  features: number[]
): number {
  if (!model.weights) return 0;

  let sum = 0;
  for (let i = 0; i < features.length; i++) {
    sum += features[i] * model.weights[i];
  }
  return sigmoid(sum);
}
