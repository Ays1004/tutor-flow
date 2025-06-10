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

  if (loading) return <p className="p-6">Loading your sessions...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📚 Your Sessions</h1>
      {sessions.length === 0 ? (
        <p>No summaries or Q&As found. Upload a PDF to get started!</p>
      ) : (
        <ul className="space-y-6">
          {sessions.map((session) => (
            <li key={session.id} className="p-4 border rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold">{session.title}</p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
                <div className='flex-col flex text-end'>
                  <button
                  className="text-blue-500 hover:underline pb-4"
                  onClick={() => router.push(`/view/${session.id}`)}
                >
                  View ➜
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDelete(session.id)}
                >
                  Delete ➜
                </button>
                </div>
                
              </div>
              <p className="text-sm text-gray-700">
                {session.summary?.length || 0} Topics • {session.questions?.length || 0} Questions
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
