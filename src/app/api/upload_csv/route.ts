import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { analyzeColumns } from '@/lib/preprocess';
import { validateDataset, mergeValidationIntoUpload } from '@/lib/dataset-validator';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();

    return new Promise<Response>((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const columns = results.meta.fields || [];
          const rawData = results.data as Record<string, string>[];

          const analysis = analyzeColumns(columns, rawData);

          // Validate dataset for customer analytics suitability
          const validation = validateDataset(columns, analysis.columnAnalysis, rawData.length);

          const uploadResult = {
            originalColumns: columns,
            columns: analysis.cleanedColumns,
            rowCount: rawData.length,
            cleanedRowCount: analysis.cleanedData.length,
            preview: rawData.slice(0, 5),
            cleanedPreview: analysis.cleanedData.slice(0, 5),
            cleanedData: analysis.cleanedData,
            columnAnalysis: analysis.columnAnalysis,
            droppedColumns: analysis.droppedColumns,
          };

          // Merge validation results
          const result = mergeValidationIntoUpload(uploadResult, validation);

          resolve(NextResponse.json(result));
        },
        error: (error: Error) => {
          resolve(NextResponse.json(
            { error: error.message },
            { status: 400 }
          ));
        },
      });
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse CSV' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'CSV upload endpoint - use POST with a CSV file' });
}