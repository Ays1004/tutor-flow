import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
    try {
        const { user_id, title, context } = await request.json();
        const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "system",
                        content:
                            'You are a helpful assistant. Extract all important topics from the text. Your response must be a valid JSON array of objects, where each object has a "topic" property. Example format: [{"topic": "X topic"}, {"topic": "Y Topic"}]. Do not include any other text or formatting, just the JSON array.',
                    },
                    {
                        role: "user",
                        content: `Extract all the important topics from the following text:\n\n${context}`,
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const summary = groqRes.data.choices[0].message.content;
        const { error: supabaseError } = await supabase
            .from('user_question_data')
            .upsert([
                { user_id, title, context, summary }
            ]);
        if (supabaseError) {
            return NextResponse.json({ error: "Failed to save to database", details: supabaseError.message }, { status: 500 });
        }
        return NextResponse.json({ summary });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate summary", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
