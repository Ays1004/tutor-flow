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

  if (loading) return <p className="p-6">Loading session details...</p>;
  if (!session) return <p className="p-6">Session not found.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{session.title}</h1>
        <p className="text-sm text-gray-500">
          {new Date(session.created_at).toLocaleString()}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 justify-center mb-4">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'summary'
              ? 'bg-slate-900 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setViewMode('answers')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'answers'
              ? 'bg-slate-900 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800'
          }`}
        >
          Questions & Answers
        </button>
      </div>

      {/* Tab content */}
      {viewMode === 'summary' && (
        <section>
          <Summary initialTopics={session.summary} context={session.context} />
        </section>
      )}

      {viewMode === 'answers' && (
        <section>
          <Answers initialQuestions={session.questions} context={session.context} />
        </section>
      )}
    </div>
  );
}
