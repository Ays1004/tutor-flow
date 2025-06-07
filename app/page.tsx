"use client"
import { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import Summary from "@/components/Summary/Summary";


//summary
//answers
//expand on topic
//important questions


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (files: File[]) => {
    try {
      const uploadedFile = files?.[0];
      if (!uploadedFile) {
        return;
      }

      setFile(uploadedFile);
      setLoading(true);
      setSummary(null);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      setSummary(data.summary);
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
      <FileUpload onChange={handleFile} />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {loading && <p className="mt-2">Processing PDF...</p>}
      {summary && (
        <Summary summary={summary} ></Summary>
      )}
    </div>
  );
}
