'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email ?? null);
      }
    };

    getUser();
  }, []);

  const login = async () => {
        await supabase.auth.signInWithOAuth({ provider: "google" });
    };
    
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh;
  };

  const initials = userEmail?.[0]?.toUpperCase() || '?';

  return (
    <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">Tutor-Flow</Link>

        <ul className="flex items-center gap-6">
          <li>
            <Link
              href="/dashboard"
              className={`hover:underline ${
                pathname === '/dashboard' ? 'text-blue-600 font-semibold' : 'text-gray-700'
              }`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/upload"
              className={`hover:underline ${
                pathname === '/upload' ? 'text-blue-600 font-semibold' : 'text-gray-700'
              }`}
            >
              Upload
            </Link>
          </li>

          {userEmail ? (
            <li className="relative">
              <button
                className="w-9 h-9 bg-blue-500 text-white rounded-full text-sm font-bold"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                {initials}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-md border z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    {userEmail}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li>
              <button onClick={login} className="text-blue-600 hover:underline">
                Sign In
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
