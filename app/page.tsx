"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LoginModal } from "@/components/LoginModal/LoginModal";
import { SignupModal } from "@/components/SignUpModal/SignUpModal";

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleUploadClick = useCallback(() => {
    if (isLoggedIn) {
      router.push("/upload");
    } else {
      setLoginOpen(true);
    }
  }, [isLoggedIn, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-[#101010] dark:via-[#212121] dark:to-[#353535] flex flex-col items-center justify-center px-4">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-4xl pt-5 md:text-6xl font-extrabold text-gray-900 dark:text-white text-center mb-6"
      >
        Tutor-Flow
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-lg md:text-2xl text-gray-700 dark:text-gray-200 text-center mb-10 max-w-2xl"
      >
        Your all-in-one AI-powered study assistant. Instantly get summaries and Q&A from any university PDF.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-2xl justify-center"
      >
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:bg-blue-700 transition w-full md:w-auto"
          onClick={handleUploadClick}
        >
          Upload PDF
        </button>
        <button className="px-6 py-3 bg-gray-200 text-gray-900 rounded-2xl font-semibold text-lg shadow-lg hover:bg-gray-300 transition w-full md:w-auto dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
          Learn More
        </button>
      </motion.div>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
        className="mt-16 md:mt-20 grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3 w-full max-w-5xl"
      >
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-3">📄</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Easy Uploads</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Upload any university PDF and get started instantly.
          </p>
        </div>
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-3">🧠</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Smart Summaries</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            AI summarizes key concepts and topics in seconds.
          </p>
        </div>
        <div className="bg-white/80 dark:bg-white/5 rounded-2xl p-6 shadow flex flex-col items-center">
          <span className="text-3xl mb-3">❓</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Q&A Generator</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Instantly generate exam-style questions and answers.
          </p>
        </div>
      </motion.section>

      {/* TODO: Replace or expand below with testimonials, pricing, or other info */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.3 }}
        className="mt-16 md:mt-24 text-center max-w-3xl"
      >
        <h2 className="text-2xl text-gray-900 dark:text-white font-bold mb-4">
          {/* TODO: Section Title, e.g., "Why Choose Tutor-Flow?" */}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          {/* TODO: Add some compelling points, user testimonials, or more features here */}
        </p>
      </motion.section>

      <LoginModal
        open={loginOpen}
        setOpen={setLoginOpen}
        switchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />
      <SignupModal
        open={signupOpen}
        setOpen={setSignupOpen}
        switchToLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
      />
    </main>
  );
}
