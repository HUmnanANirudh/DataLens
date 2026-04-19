import { NextRequest, NextResponse } from 'next/server';
import { prepareDataset } from '@/lib/ml/featureEngineering';
import { predict, PredictionResult } from '@/lib/ml/predict';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, columns, targetColumn, modelType, modelData, encodingMaps, scalerParams } = body;

    if (!data || !columns || !targetColumn) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!modelType || !modelData) {
      return NextResponse.json(
        { error: 'Missing model data' },
        { status: 400 }
      );
    }

    // Prepare dataset using training-time encoding maps and scaler params
    const { dataset } = prepareDataset(data, columns, targetColumn, encodingMaps, scalerParams);

    if (dataset.features.length === 0) {
      return NextResponse.json(
        { error: 'No valid data after preprocessing' },
        { status: 400 }
      );
    }

    // Run prediction using modelData from training
    const model = { type: modelType, ...modelData };
    const result: PredictionResult = predict(model, dataset.features);

    // Calculate summary statistics
    const total = result.probabilities.length;
    const highRisk = result.probabilities.filter(p => p >= 0.7).length;
    const mediumRisk = result.probabilities.filter(p => p >= 0.4 && p < 0.7).length;
    const lowRisk = result.probabilities.filter(p => p < 0.4).length;
    const avgProbability = result.probabilities.reduce((a, b) => a + b, 0) / total;

    return NextResponse.json({
      success: true,
      predictions: {
        probabilities: result.probabilities,
        predictions: result.predictions,
        riskLevels: result.riskLevels,
      },
      summary: {
        total,
        highRisk,
        mediumRisk,
        lowRisk,
        highRiskPercent: (highRisk / total) * 100,
        mediumRiskPercent: (mediumRisk / total) * 100,
        lowRiskPercent: (lowRisk / total) * 100,
        avgProbability,
      },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prediction failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Prediction endpoint - POST with { data, columns, targetColumn, modelType, modelData, encodingMaps, scalerParams }',
  });
}
