"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-white rounded-full hover:text-gray-200"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-white md:text-7xl">
            D&D Companion
          </h1>
          <p className="max-w-2xl mb-12 text-xl text-gray-300 md:text-2xl">
            Your ultimate D&D 5e campaign management tool. Create characters,
            manage campaigns, and track your adventures.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="px-8 py-3 text-lg font-semibold text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Get Started
            </Link>
            <Link
              href="/signin"
              className="px-8 py-3 text-lg font-semibold text-white transition-colors duration-200 bg-transparent border-2 border-white rounded-lg hover:bg-white hover:text-gray-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
