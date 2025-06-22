'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type SessionEntry = {
  id: string;
  user_id: string;
  title: string;
  summary: { topic: string }[]; // parsed from JSON
  questions: { question: string; answer?: string }[];
  context: string;
  created_at: string;
};

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Update handleDelete to accept an id and update state after deletion
  const handleDelete = async (id: string) => {
  const confirmed = window.confirm('Are you sure you want to delete this session? This action cannot be undone.');

  if (!confirmed) return;

  const { error } = await supabase
    .from('user_question_data')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Failed to delete session: ' + error.message);
    return;
  }

  setSessions((prev) => prev.filter((session) => session.id !== id));
};


  useEffect(() => {
    const fetchSessions = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      

      if (authError || !user) {
        console.error('Auth error:', authError?.message);
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('user_question_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error.message);
        setLoading(false);
        return;
      }

      // Parse summary and questions JSON strings
      const parsedSessions = data.map((entry: any) => ({
  ...entry,
  summary: typeof entry.summary === 'string' ? JSON.parse(entry.summary) : entry.summary || [],
  questions: typeof entry.questions === 'string' ? JSON.parse(entry.questions) : entry.questions || [],
}));


      setSessions(parsedSessions);
      setLoading(false);
    };

    fetchSessions();
  }, []);

  if (loading) return <p className="p-6 text-center text-gray-700 dark:text-gray-300">Loading your sessions...</p>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">📚 Your Sessions</h1>
      {sessions.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">No summaries or Q&As found. Upload a PDF to get started!</p>
      ) : (
        <ul className="space-y-4 sm:space-y-6">
          {sessions.map((session) => (
            <li key={session.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">{session.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Created: {new Date(session.created_at).toLocaleString()}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                  {session.summary?.length || 0} Topics • {session.questions?.length || 0} Questions
                </p>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 sm:gap-0 sm:items-end">
                <button
                  className="px-3 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors mb-0 sm:mb-2"
                  onClick={() => router.push(`/view/${session.id}`)}
                >
                  View ➜
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  onClick={() => handleDelete(session.id)}
                >
                  Delete ➜
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
