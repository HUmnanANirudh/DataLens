import { NextRequest, NextResponse } from 'next/server';
import { prepareDataset } from '@/lib/ml/featureEngineering';
import { analyzeChurn, generateDecisions } from '@/lib/decisions';
import { DecisionEngineResult, ChurnAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, columns, targetColumn, modelWeights, modelType, featureImportances } = body;

    if (!data || !columns || !targetColumn) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare dataset
    const { dataset } = prepareDataset(data, columns, targetColumn);

    if (dataset.features.length === 0) {
      return NextResponse.json(
        { error: 'No valid data after preprocessing' },
        { status: 400 }
      );
    }

    // Build a minimal model object for analysis
    const model = {
      config: { name: 'Selected Model', type: modelType || 'unknown' },
      evaluation: { accuracy: 0, f1: 0, precision: 0, recall: 0 },
      weights: modelWeights,
      featureImportances: featureImportances,
    };

    // Analyze churn risk
    const churnAnalysis: ChurnAnalysis = analyzeChurn(model, dataset);

    // Generate decisions
    const decisions: DecisionEngineResult = generateDecisions(churnAnalysis);

    return NextResponse.json({
      success: true,
      churnAnalysis,
      decisions,
    });
  } catch (error) {
    console.error('Decision error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Decision generation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Decision endpoint - POST with { data, columns, targetColumn, modelWeights, modelType, featureImportances }',
  });
}
