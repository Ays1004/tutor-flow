"use client";
import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import Summary from "@/components/Summary/Summary";
import Answers from "@/components/Answers/Answers";

type ViewMode = "summary" | "answers";

//summary
//answers
//expand on topic
//important questions

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [summaryCache, setSummaryCache] = useState<Record<string, string>>({});
    const [qnaCache, setQnaCache] = useState<Record<string, { questions: { question: string }[]; context: string }>>({});
    const [summary, setSummary] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Array<{ question: string }> | null>(null);
    const [context, setContext] = useState<string | null>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("summary");

    // Helper to get a unique key for the file (using name + size as a simple hash)
    const getFileKey = (f: File | null) => (f ? `${f.name}_${f.size}` : "");

    // Ref to prevent double-fetch on initial mount
    const isFirstLoad = useRef(true);

    const fetchData = async (mode: ViewMode, uploadedFile: File) => {
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", uploadedFile);
            formData.append("mode", mode);

            const response = await fetch("/api/process-pdf", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to process PDF");
            }

            const data = await response.json();
            const fileKey = getFileKey(uploadedFile);

            if (mode === "summary") {
                setSummaryCache(prev => ({ ...prev, [fileKey]: data.summary }));
                setSummary(data.summary);
            } else {
                setQnaCache(prev => ({
                    ...prev,
                    [fileKey]: { questions: data.questions, context: data.context }
                }));
                setQuestions(data.questions);
                setContext(data.context);
            }
        } catch (err) {
            setError("Failed to process PDF file");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFile = async (files: File[]) => {
        const uploadedFile = files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setSummary(null);
        setQuestions(null);
        setContext(null);

        const fileKey = getFileKey(uploadedFile);

        if (viewMode === "summary" && summaryCache[fileKey]) {
            setSummary(summaryCache[fileKey]);
        } else if (viewMode === "answers" && qnaCache[fileKey]) {
            setQuestions(qnaCache[fileKey].questions);
            setContext(qnaCache[fileKey].context);
        } else {
            fetchData(viewMode, uploadedFile);
        }
    };

    // Regenerate summary/QnA when viewMode changes, using cache if available
    useEffect(() => {
        if (!file) return;
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            return;
        }
        const fileKey = getFileKey(file);

        if (viewMode === "summary") {
            if (summaryCache[fileKey]) {
                setSummary(summaryCache[fileKey]);
            } else {
                setSummary(null);
                fetchData("summary", file);
            }
        } else if (viewMode === "answers") {
            if (qnaCache[fileKey]) {
                setQuestions(qnaCache[fileKey].questions);
                setContext(qnaCache[fileKey].context);
            } else {
                setQuestions(null);
                setContext(null);
                fetchData("answers", file);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    return (
        <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <div className="text-center pb-5">
                <div className="pb-5 text-4xl font-bold">
                    Tutor-Flow
                </div>
                <div className="pb-2 text-gray-600">
                    Upload your question paper as a parseable PDF to get instant summaries, important topics, and AI-generated Q&A, <span className="text-gray-950">all in one place</span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => setViewMode("summary")}
                        className={`px-4 py-2 rounded-md ${
                            viewMode === "summary"
                                ? "bg-blue-500 text-white"
                                : "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                    >
                        Summary
                    </button>
                    <button
                        onClick={() => setViewMode("answers")}
                        className={`px-4 py-2 rounded-md ${
                            viewMode === "answers"
                                ? "bg-blue-500 text-white"
                                : "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                    >
                        Questions & Answers
                    </button>
                </div>
            </div>
            <FileUpload onChange={handleFile} />
            <div className="pb-2 text-gray-400 text-center">
                Only supports pdf files with scannable text for now. (eg. Question Papers from University)
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {loading && <p className="mt-2">Processing PDF...</p>}
            {summary && viewMode === "summary" && <Summary summary={summary} />}
            {questions && context && viewMode === "answers" && (
                <Answers questions={questions} context={context} />
            )}
        </div>
    );
}
