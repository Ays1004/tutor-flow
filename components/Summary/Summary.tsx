import React from 'react'
import Markdown from 'react-markdown';

interface SummaryProps {
  summary: string;
}

const Summary = ({ summary }: SummaryProps) => {
  return (
    <div>
      <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <div className="whitespace-pre-wrap border p-4 rounded-md bg-neutral-50 dark:bg-neutral-900">
            <Markdown>{summary}</Markdown>
          </div>
        </div>
    </div>
  )
}

export default Summary
