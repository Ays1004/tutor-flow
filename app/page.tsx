"use client"
import { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import Summary from "@/components/Summary/Summary";
import Answers from "@/components/Answers/Answers";

type ViewMode = 'summary' | 'answers';

//summary
//answers
//expand on topic
//important questions


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<{ question: string }> | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  const handleFile = async (files: File[]) => {
    try {
      const uploadedFile = files?.[0];
      if (!uploadedFile) {
        return;
      }

      setFile(uploadedFile);
      setLoading(true);
      setSummary(null);
      setQuestions(null);
      setContext(null);

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('mode', viewMode);

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      if (viewMode === 'summary') {
        setSummary(data.summary);
      } else {
        setQuestions(data.questions);
        setContext(data.context);
      }
      setError("");
    } catch (err) {
      setError("Failed to process PDF file");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
      <div className="mb-4">
        {/* <label className="block text-sm font-medium mb-2">Select Mode:</label> */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'summary'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode('answers')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'answers'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            Questions & Answers
          </button>
        </div>
      </div>
      <FileUpload onChange={handleFile} />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {loading && <p className="mt-2">Processing PDF...</p>}
      {summary && viewMode === 'summary' && (
        <Summary summary={summary} />
      )}
      {questions && context && viewMode === 'answers' && (
        <Answers questions={questions} context={context} />
      )}
    </div>
  );
}
