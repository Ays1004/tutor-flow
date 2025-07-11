import { NextResponse } from 'next/server';
import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json();

    if (!question || !context) {
      return NextResponse.json({ error: 'Question and context are required' }, { status: 400 });
    }

    const groqRes = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful assistant. Provide a **detailed**, **accurate**, and **well-structured** answer to the given question. Use **Markdown** formatting for readability and clarity.

- **Highlight key concepts** by making them **bold**.  
- When applicable, use **LaTeX syntax** to display all mathematical formulas, equations, and expressions.  

- Always explain relevant **theory**, **steps**, and **context** before solving or giving a direct answer.  
- Use **bullet points**, **headings**, and **code blocks** (where necessary) to enhance clarity.  
- Aim to teach the concept, not just give the answer.
` 
          },
          { 
            role: 'user', 
            content: `Context:\n${context}\n\nQuestion: ${question}` 
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