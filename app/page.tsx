"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FileUpload } from "@/components/ui/file-upload";
import Answers from "@/components/Answers/Answers";
import SummaryFromFile from "@/components/Summary/SummaryFromFile";

type ViewMode = "summary" | "answers";

//Track Metadata -
//User Dashboard 
//History of summaries 
//Multiple PDFs 
//Tags 
//Re-Parse if the model is updated 
//Export Answers as a pdf document 
//Handwritten Pdf scan (far future)

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
            formData.append("mode", mode);
            if (user?.id) {
                formData.append("user_id", user.id); // Add user_id to form
            }
            const response = await fetch("/api/process-pdf", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error("Failed to process PDF");
            const data = await response.json();
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

    return (
        <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <div className="justify-center flex-row items-center text-center pb-5">
                <div className="pr-2">
                    <div className="pb-2 text-4xl font-bold">
                        Tutor-Flow{" "}
                        <span className="text-xl text-gray-600">beta</span>
                    </div>
                    <div className="pb-2 text-gray-600">
                        Upload your question paper as a parseable PDF to get
                        instant summaries, important topics, and AI-generated
                        Q&A,{" "}
                        <span className="text-gray-950">all in one place</span>
                    </div>
                </div>
                
            </div>

            <FileUpload onChange={handleFile} />
            <div className="pb-2 text-gray-400 text-center">
                Only supports parseable pdf files with scannable text for now.
                (eg. Question Papers from University)
            </div>


            <div className="mb-7 mt-7">
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => setViewMode("summary")}
                        className={`px-4 py-2 rounded-md ${
                            viewMode === "summary"
                                ? "bg-slate-900 text-white"
                                : "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                    >
                        Summary
                    </button>
                    <button
                        onClick={() => setViewMode("answers")}
                        className={`px-4 py-2 rounded-md ${
                            viewMode === "answers"
                                ? "bg-slate-900 text-white"
                                : "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                    >
                        Questions & Answers
                    </button>
                </div>
            </div>

            <SummaryFromFile
                file={file}
                viewMode={viewMode}
                summaryCache={summaryCache}
                setSummaryCache={setSummaryCache}
            />
            {viewMode === "answers" &&
                (qnaLoading ? (
                    <p className="mt-2 text-center">Processing PDF...</p>
                ) : questions && context ? (
                    <Answers initialQuestions={questions} context={context} />
                ) : null)}
        </div>
    );
}
