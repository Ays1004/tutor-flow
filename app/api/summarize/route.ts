// app/api/summarize/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

const groqUrl= process.env.GROQ_API_KEY

interface SummarizeRequestBody {
    text: string;
    type: 'summary' | 'flashcards' | 'mcq' | 'mindmap';
}

interface GroqMessage {
    role: 'system' | 'user';
    content: string;
}

interface GroqChoice {
    message: {
        content: string;
    };
}

interface GroqResponse {
    choices: GroqChoice[];
}

export async function POST(req: Request): Promise<NextResponse> {
    const { text, type }: SummarizeRequestBody = await req.json();

    const promptMap: Record<SummarizeRequestBody['type'], string> = {
        summary: `Summarize this academic text:\n\n${text}`,
        flashcards: `Create flashcards from this:\n\n${text}`,
        mcq: `Create 5 MCQs with 4 options and answers:\n\n${text}`,
        mindmap: `Create a mind map in Mermaid.js from this:\n\n${text}`
    };

    const response = await axios.post<GroqResponse>(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.1-8b-instant", // or mixtral
            messages: [
                { role: "system", content: "You are a helpful academic assistant." },
                { role: "user", content: promptMap[type] }
            ] as GroqMessage[]
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    return NextResponse.json(response.data.choices[0].message.content);
}

export async function summarizeWithGroq(text: string): Promise<string> {
    const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama3-8b-8192',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: `Summarize the following academic text:\n\n${text}` },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return groqRes.data.choices[0].message.content;
}
