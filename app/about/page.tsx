"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function About() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };
    checkUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold">TubeRank</h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/videos" className="text-sm font-medium text-gray-600 hover:text-black">Videos</Link>
            <Link href="/shorts" className="text-sm font-medium text-gray-600 hover:text-black">Shorts</Link>
            <Link href="/sponsored" className="text-sm font-medium text-gray-600 hover:text-black">Sponsored</Link>
            <Link href="/about" className="text-sm font-medium text-red-600">About</Link>
            {user ? (
              <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-black">{user.user_metadata?.full_name?.split(" ")[0] || "Profile"}</Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">← Home</Link>
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border p-8">
          <h2 className="text-2xl font-bold text-center mb-6">About TubeRank</h2>
          
          <p className="text-gray-600 text-center mb-8">
            TubeRank is built by two engineering students passionate about helping YouTube creators grow.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <img src="/moin.jpg" alt="Moin Sayyad" className="w-16 h-16 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=M"; }} />
              <div>
                <h3 className="font-bold text-lg">Moin Sayyad</h3>
                <p className="text-gray-600">Computer Engineer</p>
                <p className="text-sm text-gray-500">CSMSS College of Engineering, Chh. Sambhajinagar</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <img src="/akib.jpg" alt="Akib Sayyad" className="w-16 h-16 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=A"; }} />
              <div>
                <h3 className="font-bold text-lg">Akib Sayyad</h3>
                <p className="text-gray-600">Artificial Intelligence & Data Science Engineer</p>
                <p className="text-sm text-gray-500">CSMSS College of Engineering, Chh. Sambhajinagar</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">© 2026 TubeRank • tuberank.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}