import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto"; // Import crypto for hashing

// Function to generate a unique hash
const generateHash = (user_id: string, context: string) => {
    return createHash('sha256').update(`${user_id}-${context}`).digest('hex');
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const mode = formData.get("mode") as string;
        const user_id = formData.get("user_id") as string;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!file.type || !file.type.includes("pdf")) {
            return NextResponse.json(
                { error: "Only PDF files are supported" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser();
            pdfParser.on("pdfParser_dataError", (errData) =>
                reject(errData.parserError)
            );
            pdfParser.on("pdfParser_dataReady", (pdfData) => {
                const pages = pdfData.Pages;
                const allText = pages
                    .map((page: any) =>
                        page.Texts.map((t: any) =>
                            decodeURIComponent(
                                t.R.map((r: any) => r.T).join("")
                            )
                        ).join(" ")
                    )
                    .join("\n\n");
                resolve(allText);
            });
            pdfParser.parseBuffer(buffer);
        });

        const uniqueHash = generateHash(user_id, text); // Generate unique hash

        if (mode === "summary") {
            // Call Groq API for summarization
            const groqRes = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    messages: [
                        {
                            role: "system",
                            content:
                                'You are a helpful assistant. Extract all important topics from the text. Your response must be a valid JSON array of objects, where each object has a "topics" property. Example format: [{"topic": "X topic"}, {"topic": "Y Topic"}]. Do not include any other text or formatting, just the JSON array.',
                        },
                        {
                            role: "user",
                            content: `Extract all the important topics from the following text:\n\n${text}`,
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

            // Insert into Supabase
            const { error: supabaseError } = await supabase
                .from('user_question_data')
                .upsert(
                    [
                        {
                            user_id,
                            title: file.name,
                            context: text,
                            summary,
                            hash: uniqueHash // Store the hash
                        }
                    ],
                    {
                        onConflict: 'hash', // Use hash for conflict resolution if desired
                        ignoreDuplicates: false
                    }
                );
            if (supabaseError) {
                console.error("Supabase upsert error:", supabaseError);
                return NextResponse.json(
                    { error: "Failed to save to database", details: supabaseError.message },
                    { status: 500 }
                );
            }
            return NextResponse.json({ summary });
        } else {
            // Call Groq API for questions
            const groqRes = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    messages: [
                        {
                            role: "system",
                            content:
                                'You are a helpful assistant. Extract all questions from the text. Your response must be a valid JSON array of objects, where each object has a "question" property. Example format: [{"question": "What is X?"}, {"question": "How does Y work?"}]. Do not include any other text or formatting, just the JSON array.',
                        },
                        {
                            role: "user",
                            content: `Extract questions from the following text:\n\n${text}`,
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

            const rawContent = groqRes.data.choices[0].message.content;
            let questions;
            try {
                questions = JSON.parse(rawContent);
            } catch (jsonError) {
                console.error(
                    "Failed to parse questions JSON. Raw content:",
                    rawContent
                );
                throw new Error(
                    "Groq API did not return valid JSON for questions."
                );
            }

            // Insert into Supabase
            const { error: supabaseError } = await supabase
                .from('user_question_data')
                .upsert(
                    [
                        {
                            user_id,
                            title: file.name,
                            context: text,
                            questions,
                            hash: uniqueHash // Store the hash
                        }
                    ],
                    {
                        onConflict: 'hash', // Use hash for conflict resolution if desired
                        ignoreDuplicates: false
                    }
                );
            if (supabaseError) {
                console.error("Supabase upsert error:", supabaseError);
                return NextResponse.json(
                    { error: "Failed to save to database", details: supabaseError.message },
                    { status: 500 }
                );
            }
            return NextResponse.json({ questions, context: text });
        }
    } catch (error) {
        console.error("PDF processing or analysis error:", error);
        return NextResponse.json(
            {
                error: "Failed to process PDF file or analyze content",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
