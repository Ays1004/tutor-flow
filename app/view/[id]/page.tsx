'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Summary from '@/components/Summary/Summary';
import Answers from '@/components/Answers/Answers';

type SessionData = {
  id: string;
  title: string;
  summary: { topic: string }[];
  questions: { question: string; answer?: string }[];
  context: string;
  created_at: string;
};

type ViewMode = 'summary' | 'answers';

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  useEffect(() => {
    const fetchSession = async () => {
      if (!id || typeof id !== 'string') return;

      const { data, error } = await supabase
        .from('user_question_data')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch session:', error.message);
        router.push('/dashboard');
        return;
      }

      setSession({
        ...data,
        summary: typeof data.summary === 'string' ? JSON.parse(data.summary) : data.summary || [],
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions || [],
      });

      setLoading(false);
    };

    fetchSession();
  }, [id]);

  if (loading) return <p className="p-6 text-center text-gray-700 dark:text-gray-300">Loading session details...</p>;
  if (!session) return <p className="p-6 text-center text-gray-600 dark:text-gray-400">Session not found.</p>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 break-words">{session.title}</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {new Date(session.created_at).toLocaleString()}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 justify-center mb-2 sm:mb-4">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 ${
            viewMode === 'summary'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow'
              : 'bg-neutral-100 dark:bg-neutral-800 text-slate-900 dark:text-slate-100'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setViewMode('answers')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 ${
            viewMode === 'answers'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow'
              : 'bg-neutral-100 dark:bg-neutral-800 text-slate-900 dark:text-slate-100'
          }`}
        >
          Questions & Answers
        </button>
      </div>

      {/* Tab content */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
        {viewMode === 'summary' && (
          <Summary initialTopics={session.summary} context={session.context} />
        )}
        {viewMode === 'answers' && (
          <Answers initialQuestions={session.questions} context={session.context} />
        )}
      </section>
    </div>
  );
}
