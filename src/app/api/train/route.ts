import { NextRequest, NextResponse } from 'next/server';
import { prepareDataset } from '@/lib/ml/featureEngineering';
import { trainAllModels } from '@/lib/ml/modelSelector';
import { TrainRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: TrainRequest = await req.json();
    const { data, columns, targetColumn } = body;

    if (!data || !columns || !targetColumn) {
      return NextResponse.json(
        { error: 'Missing data, columns, or targetColumn' },
        { status: 400 }
      );
    }

    // Prepare dataset (Layer 2 - Feature Engineering, single source of truth)
    const { dataset, encodingMaps, scalerParams } = prepareDataset(data, columns, targetColumn);

    if (dataset.features.length === 0) {
      return NextResponse.json(
        { error: 'No valid data after preprocessing' },
        { status: 400 }
      );
    }

    // Train all models and select best
    const result = trainAllModels(dataset);

    // Return best model with all data needed for inference
    return NextResponse.json({
      success: true,
      leaderboard: result.leaderboard,
      bestModel: {
        name: result.bestModel.config.name,
        type: result.bestModel.config.type,
        evaluation: result.bestModel.evaluation,
        modelData: {
          weights: result.bestModel.weights,
          trees: result.bestModel.trees,
          featureImportances: result.bestModel.featureImportances,
        },
      },
      totalModels: result.allModels.length,
      featureNames: dataset.featureNames,
      encodingMaps,
      scalerParams,
    });
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Training failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Training endpoint - POST with { data, columns, targetColumn }',
  });
}
