"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FileUpload } from "@/components/ui/file-upload";
import Answers from "@/components/Answers/Answers";
import SummaryFromFile from "@/components/Summary/SummaryFromFile";
import { motion } from "framer-motion";

type ViewMode = "summary" | "answers";

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [summaryCache, setSummaryCache] = useState<Record<string, string>>(
        {}
    );
    const [qnaCache, setQnaCache] = useState<
        Record<string, { questions: { question: string }[]; context: string }>
    >({});
    const [questions, setQuestions] = useState<Array<{
        question: string;
    }> | null>(null);
    const [context, setContext] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("summary");
    const [qnaLoading, setQnaLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Helper to get a unique key for the file (using name + size as a simple hash)
    const getFileKey = (f: File | null) => (f ? `${f.name}_${f.size}` : "");

    const handleFile = async (files: File[]) => {
        const uploadedFile = files?.[0];
        if (!uploadedFile) return;
        setFile(uploadedFile);
        setQuestions(null);
        setContext(null);
        setQnaLoading(false);
        const fileKey = getFileKey(uploadedFile);
        if (viewMode === "answers" && qnaCache[fileKey]) {
            setQuestions(qnaCache[fileKey].questions);
            setContext(qnaCache[fileKey].context);
        } else if (viewMode === "answers") {
            setQnaLoading(true);
            fetchData("answers", uploadedFile);
        }
    };

    // Regenerate QnA when viewMode changes, using cache if available
    useEffect(() => {
        if (!file) return;
        const fileKey = getFileKey(file);
        if (viewMode === "answers") {
            if (qnaCache[fileKey]) {
                setQuestions(qnaCache[fileKey].questions);
                setContext(qnaCache[fileKey].context);
                setQnaLoading(false);
            } else {
                setQuestions(null);
                setContext(null);
                setQnaLoading(true);
                fetchData("answers", file);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, file]);

    // Check auth state on mount 
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        getUser();
        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );
        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

        // Only fetch QnA when needed
    const fetchData = async (mode: ViewMode, uploadedFile: File) => {
        if (mode !== "answers") return;
        try {
            const formData = new FormData();
            formData.append("file", uploadedFile);
            if (user?.id) {
                formData.append("user_id", user.id); // Add user_id to form
            }
            // Step 1: Extract text from PDF
            const processRes = await fetch("/api/process-pdf", {
                method: "POST",
                body: formData,
            });
            if (!processRes.ok) throw new Error("Failed to process PDF");
            const processData = await processRes.json();
            // Step 2: Generate questions from extracted text
            const questionsRes = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: processData.user_id,
                    title: processData.title,
                    context: processData.context,
                }),
            });
            if (!questionsRes.ok) throw new Error("Failed to generate questions");
            const data = await questionsRes.json();
            const fileKey = getFileKey(uploadedFile);
            setQnaCache((prev) => ({
                ...prev,
                [fileKey]: { questions: data.questions, context: data.context },
            }));
            setQuestions(data.questions);
            setContext(data.context);
            setQnaLoading(false);
        } catch (err) {
            setQuestions(null);
            setContext(null);
            setQnaLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-center shadow-md mt-6">
                <div className="text-center">
                    <div className="text-2xl font-bold mb-2 text-slate-900 dark:text-sky-200">
                        Please login to access this page
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 mb-4">
                        You must be signed in to upload and process files.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-md mt-6 flex flex-col gap-4">
            <motion.div
                className="flex flex-col items-center justify-center text-center gap-2 pb-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                <motion.div
                    className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold dark:text-sky-200 text-slate-900 flex items-center gap-2"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.7, type: "spring" }}
                >
                    Tutor-Flow
                    <motion.span
                        className="text-base sm:text-xl lg:text-2xl xl:text-3xl text-gray-600 dark:text-sky-300 font-semibold ml-2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        beta
                    </motion.span>
                </motion.div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg xl:text-xl max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto">
                    Upload your question paper as a parseable PDF to get
                    instant summaries, important topics, and AI-generated Q&A,
                    <span className="text-gray-950 dark:text-sky-200 font-semibold ml-1">all in one place</span>
                </div>
            </motion.div>

            <div className="w-full flex flex-col items-center gap-2">
                <FileUpload onChange={handleFile} />
                <div className="text-xs text-gray-400 text-center mt-1">
                    Only supports parseable PDF files with scannable text for now.<br className="hidden sm:block" />
                    (e.g. Question Papers from University)
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
                <button
                    onClick={() => setViewMode("summary")}
                    className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black
                        ${viewMode === "summary"
                            ? "bg-slate-900 text-white dark:bg-sky-800 dark:text-sky-100"
                            : "bg-neutral-100 dark:bg-neutral-800 text-slate-900 dark:text-sky-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"}
                    `}
                >
                    Summary
                </button>
                <button
                    onClick={() => setViewMode("answers")}
                    className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black
                        ${viewMode === "answers"
                            ? "bg-slate-900 text-white dark:bg-sky-800 dark:text-sky-100"
                            : "bg-neutral-100 dark:bg-neutral-800 text-slate-900 dark:text-sky-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"}
                    `}
                >
                    Questions & Answers
                </button>
            </div>

            <div className="mt-4">
                <SummaryFromFile
                    file={file}
                    viewMode={viewMode}
                    summaryCache={summaryCache}
                    setSummaryCache={setSummaryCache}
                />
                {viewMode === "answers" &&
                    (qnaLoading ? (
                        <p className="mt-2 text-center text-sky-500 dark:text-sky-300 animate-pulse">Processing PDF...</p>
                    ) : questions && context ? (
                        <Answers initialQuestions={questions} context={context} />
                    ) : null)}
            </div>
        </div>
    );
}
