import React, { useState } from 'react';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface Topic {
  topic: string;
}

interface SummaryProps {
  initialTopics: { topic: string }[]; // ✅ matches what you're passing
  context: string;
}


const Summary = ({ initialTopics, context }: SummaryProps) => {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [topicDetails, setTopicDetails] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newTopic, setNewTopic] = useState<string>('');

  const fetchTopicDetail = async (topic: string, index: number) => {
    setLoading(prev => ({ ...prev, [index]: true }));
    setError(null);
    try {
      const response = await fetch('/api/get-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: topic, context }),
      });
      if (!response.ok) throw new Error('Failed to fetch topic details');
      const data = await response.json();
      setTopicDetails(prev => ({ ...prev, [index]: data.answer }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topic details');
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleTopicClick = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      setError(null);
    } else {
      setExpandedIndex(index);
      setError(null);
      if (!topicDetails[index]) {
        fetchTopicDetail(topics[index].topic, index);
      }
    }
  };

  const handleEditClick = (index: number, topic: string) => {
    setEditingIndex(index);
    setEditValue(topic);
  };

  const handleEditSave = (index: number) => {
    const updated = [...topics];
    updated[index] = { topic: editValue };
    setTopics(updated);
    setEditingIndex(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') handleEditSave(index);
    else if (e.key === 'Escape') setEditingIndex(null);
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    setTopics(prev => [...prev, { topic: newTopic.trim() }]);
    setNewTopic('');
  };

  if (!topics.length) return <p className="text-neutral-500">No topics found.</p>;

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-4">Summary</h2>
      <ul className="space-y-2">
        {topics.map((t, index) => (
          <li key={index}>
            <div
              className={`p-2 rounded cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-between ${expandedIndex === index ? 'bg-neutral-200 dark:bg-neutral-800' : ''}`}
              onClick={() => handleTopicClick(index)}
            >
              <span className="flex-1 min-w-0">
                <span className="font-semibold">{index + 1}) </span>
                {editingIndex === index ? (
                  <input
                    className="border rounded px-1 py-0.5 w-full max-w-140 text-black dark:text-white bg-white dark:bg-neutral-800"
                    value={editValue}
                    autoFocus
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(index)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => handleEditKeyDown(e, index)}
                  />
                ) : (
                  t.topic
                )}
              </span>
              <div className="flex items-center ml-2">
                {topicDetails[index] && !loading[index] && (
                  <button
                    className="ml-2 p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700"
                    onClick={e => {
                      e.stopPropagation();
                      fetchTopicDetail(topics[index].topic, index);
                    }}
                    title="Reload"
                  >
                    {/* SVG reload icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 30 30" className="w-5 h-5">
                      <path d="M 15 3 C 12.031398 3 9.3028202 4.0834384 7.2070312 5.875 A 1.0001 1.0001 0 1 0 8.5058594 7.3945312 C 10.25407 5.9000929 12.516602 5 15 5 C 20.19656 5 24.450989 8.9379267 24.951172 14 L 22 14 L 26 20 L 30 14 L 26.949219 14 C 26.437925 7.8516588 21.277839 3 15 3 z M 4 10 L 0 16 L 3.0507812 16 C 3.562075 22.148341 8.7221607 27 15 27 C 17.968602 27 20.69718 25.916562 22.792969 24.125 A 1.0001 1.0001 0 1 0 21.494141 22.605469 C 19.74593 24.099907 17.483398 25 15 25 C 9.80344 25 5.5490109 21.062074 5.0488281 16 L 8 16 L 4 10 z"></path>
                    </svg>
                  </button>
                )}
                {editingIndex !== index && (
                  <button
                    className="ml-2 p-1 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700"
                    onClick={e => {
                      e.stopPropagation();
                      handleEditClick(index, t.topic);
                    }}
                    title="Edit"
                  >
                    {/* SVG pencil icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.788l-4 1 1-4 13.362-13.3z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="ml-4 mt-2 p-2 border-l-2 border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded">
                {loading[index] ? (
                  <p className="text-neutral-500">Loading topic details...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : topicDetails[index] ? (
                  <MarkdownRenderer content={topicDetails[index]} />
                ) : (
                  <p className="text-neutral-500">Fetching topic details...</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Add Topic */}
      <div className="mt-6 flex items-center gap-2">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1 text-black dark:text-white bg-white dark:bg-neutral-800"
          placeholder="Type a new topic..."
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleAddTopic();
          }}
        />
        <button
          className="px-3 py-1 rounded bg-neutral-600 text-white hover:bg-neutral-700 disabled:bg-neutral-300"
          onClick={handleAddTopic}
          disabled={!newTopic.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default Summary;
