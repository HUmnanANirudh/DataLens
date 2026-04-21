import { NextRequest, NextResponse } from 'next/server';
import { simulateAction } from '@/lib/decisions/simulation';
import { Action, BaselineMetrics,SimulationResult  } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, baseline } = body as { action: Action; baseline: BaselineMetrics };

    if (!action || !baseline) {
      return NextResponse.json(
        { error: 'Missing action or baseline data' },
        { status: 400 }
      );
    }

    const result: SimulationResult = simulateAction(action, baseline);

    return NextResponse.json({
      success: true,
      simulation: result,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Simulation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simulation endpoint - POST with { action, baseline }',
  });
}