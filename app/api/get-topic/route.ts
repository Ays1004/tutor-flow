import { NextResponse } from 'next/server';
import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json();

    if (!question || !context) {
      return NextResponse.json({ error: 'Topic and context are required' }, { status: 400 });
    }

    const groqRes = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Provide a detailed and accurate explanation to the given topic loosely based on the provided context. Format the response in remark markdown for better readability. highlight keywords, do not return the topic name at start' 
          },
          { 
            role: 'user', 
            content: `Context:\n${context}\n\Topic: ${question}` 
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const answer = groqRes.data.choices[0].message.content;
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error getting answer:', error);
    return NextResponse.json({
      error: 'Failed to get answer',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 