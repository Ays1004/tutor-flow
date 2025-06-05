import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type || !file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();
      pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
      pdfParser.on('pdfParser_dataReady', pdfData => {
        // Extract text from all pages
        const pages = pdfData.Pages;
        const allText = pages.map((page: any) =>
          page.Texts.map((t: any) =>
            decodeURIComponent(t.R.map((r: any) => r.T).join(''))
          ).join(' ')
        ).join('\n\n');
        resolve(allText);
      });
      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({
      text,
      // pdf2json does not provide numPages or info directly
      numPages: undefined,
      info: undefined
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    return NextResponse.json({
      error: 'Failed to process PDF file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}