import { Dataset, TrainedModel, ModelSelectionResult } from '@/types';
import { trainTestSplit } from './featureEngineering';
import { trainLogisticRegression } from './logisticRegression';
import { trainRandomForest } from './randomForest';
import { trainXGBoost } from './xgboost';
import { trainBagging } from './bagging';

export function trainAllModels(
  dataset: Dataset,
): ModelSelectionResult {
  // Split data
  const { train, test } = trainTestSplit(dataset, 0.2);

  // Train all models
  const models: TrainedModel[] = [];

  // 1. Logistic Regression
  try {
    const lrModel = trainLogisticRegression(train, test);
    models.push(lrModel);
  } catch (e) {
    console.error('Logistic Regression failed:', e);
  }

  // 2. Random Forest
  try {
    const rfModel = trainRandomForest(train, test, 10, 5);
    models.push(rfModel);
  } catch (e) {
    console.error('Random Forest failed:', e);
  }

  // 3. XGBoost
  try {
    const xgbModel = trainXGBoost(train, test, 10, 3, 0.1);
    models.push(xgbModel);
  } catch (e) {
    console.error('XGBoost failed:', e);
  }

  // 4. Bagging
  try {
    const bagModel = trainBagging(train, test, 10, 5);
    models.push(bagModel);
  } catch (e) {
    console.error('Bagging failed:', e);
  }

  // Sort by F1 score (descending)
  const leaderboard = models
    .map((m) => ({ name: m.config.name, f1: m.evaluation.f1 }))
    .sort((a, b) => b.f1 - a.f1);

  // Select best model (highest F1)
  const bestModel = leaderboard.length > 0
    ? models.find((m) => m.config.name === leaderboard[0].name)!
    : null;

  if (!bestModel) {
    throw new Error('No models trained successfully');
  }

  return {
    bestModel,
    allModels: models,
    leaderboard,
  };
}
