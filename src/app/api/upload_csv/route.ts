import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

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

    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const columns = results.meta.fields || [];
          const preview = results.data.slice(0, 5);

          resolve(NextResponse.json({
            columns,
            rowCount: results.data.length,
            preview,
          }));
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
