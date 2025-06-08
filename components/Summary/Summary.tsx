import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';

interface SummaryProps {
  file: File | null;
  viewMode: string;
  summaryCache: Record<string, string>;
  setSummaryCache: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const Summary = ({ file, viewMode, summaryCache, setSummaryCache }: SummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to get a unique key for the file (using name + size as a simple hash)
  const getFileKey = (f: File | null) => (f ? `${f.name}_${f.size}` : "");

  useEffect(() => {
    if (!file || viewMode !== "summary") return;
    const fileKey = getFileKey(file);
    setError("");
    if (summaryCache[fileKey]) {
      setSummary(summaryCache[fileKey]);
      return;
    }
    setSummary(null);
    setLoading(true);
    const fetchSummary = async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", "summary");
        const response = await fetch("/api/process-pdf", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Failed to process PDF");
        const data = await response.json();
        setSummaryCache(prev => ({ ...prev, [fileKey]: data.summary }));
        setSummary(data.summary);
      } catch (err) {
        setError("Failed to process PDF file");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, viewMode]);

  if (viewMode !== "summary") return null;
  if (!file) return null;
  if (loading) return <p className="mt-2">Processing PDF...</p>;
  if (error) return <p className="text-red-500 mt-2">{error}</p>;
  if (!summary) return null;

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Summary</h2>
      <div className="whitespace-pre-wrap border p-4 rounded-md bg-neutral-50 dark:bg-neutral-900">
        <Markdown>{summary}</Markdown>
      </div>
    </div>
  );
};

export default Summary;
