import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string;

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

    if (mode === 'summary') {
      // Call Groq API for summarization
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: 'You are a helpful assistant, Based on the following parsed question paper data, extract all the important topics and concepts that are frequently asked or critical for exam preparation. Prioritize repeated themes, high-weightage areas, and key concepts. List them clearly and concisely without any introduction or conclusion, Format the output such that it is easily formatable with react-markdown' },
            { role: 'user', content: `Summarize the following academic text:\n\n${text}` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const summary = groqRes.data.choices[0].message.content;
      return NextResponse.json({ summary });
    } else {
      // Call Groq API for questions
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful assistant. Extract all questions from the text. Your response must be a valid JSON array of objects, where each object has a "question" property. Example format: [{"question": "What is X?"}, {"question": "How does Y work?"}]. Do not include any other text or formatting, just the JSON array.' 
            },
            { role: 'user', content: `Extract questions from the following text:\n\n${text}` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const rawContent = groqRes.data.choices[0].message.content;
      let questions;
      try {
        questions = JSON.parse(rawContent);
      } catch (jsonError) {
        console.error("Failed to parse questions JSON. Raw content:", rawContent);
        throw new Error("Groq API did not return valid JSON for questions.");
      }
      return NextResponse.json({ questions, context: text });
    }
  } catch (error) {
    console.error('PDF processing or analysis error:', error);
    return NextResponse.json({
      error: 'Failed to process PDF file or analyze content',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}