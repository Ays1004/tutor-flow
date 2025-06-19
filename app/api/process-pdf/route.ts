import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { createHash } from "crypto";

// Function to generate a unique hash
const generateHash = (user_id: string, context: string) => {
    return createHash('sha256').update(`${user_id}-${context}`).digest('hex');
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
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
        // Return parsed text and metadata for further processing
        return NextResponse.json({ context: text, user_id, title: file.name, hash: uniqueHash });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to process PDF file",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
