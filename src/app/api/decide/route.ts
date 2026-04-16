import { NextRequest, NextResponse } from 'next/server';
import { generateDecisions } from '@/lib/decisions';
import { ChurnAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { predictions, summary, featureImportances, featureNames } = body;

    if (!predictions || !predictions.probabilities) {
      return NextResponse.json(
        { error: 'Missing prediction data' },
        { status: 400 }
      );
    }

    // Build churn analysis from predictions
    const churnAnalysis: ChurnAnalysis = {
      highRiskCount: summary.highRisk,
      highRiskPercentage: summary.highRiskPercent,
      mediumRiskCount: summary.mediumRisk,
      mediumRiskPercentage: summary.mediumRiskPercent,
      lowRiskCount: summary.lowRisk,
      churnRiskDrivers: buildChurnDrivers(featureImportances, featureNames || []),
    };

    // Generate decisions using lib
    const decisions = generateDecisions(churnAnalysis);

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

function buildChurnDrivers(
  featureImportances: number[] = [],
  featureNames: string[] = []
): { feature: string; importance: number }[] {
  return featureNames
    .map((name, index) => ({
      feature: name,
      importance: featureImportances[index] || 0,
    }))
    .filter(f => f.importance > 0)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);
}

export async function GET() {
  return NextResponse.json({
    message: 'Decision endpoint - POST with { predictions, summary, featureImportances, featureNames }',
  });
}
