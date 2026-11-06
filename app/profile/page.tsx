"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please login to view profile</p>
          <Link href="/login" className="bg-red-600 text-white px-6 py-2 rounded-lg">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-white/50 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">T</div>
            <h1 className="text-2xl font-bold tracking-tight">TubeRank</h1>
          </Link>
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">← Back to Home</Link>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
              {user.user_metadata?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="text-2xl font-bold">{user.user_metadata?.name || "User"}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>

          <div className="space-y-3 border-t dark:border-gray-700 pt-6">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name</span>
              <span className="font-medium">{user.user_metadata?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Age</span>
              <span className="font-medium">{user.user_metadata?.age || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Joined</span>
              <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}