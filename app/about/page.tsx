"use client";

import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">T</div>
            <h1 className="text-2xl font-bold tracking-tight">TubeRank</h1>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-black">← Back to Home</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">About Us</h2>
        <p className="text-gray-600 text-center mb-12">
          TubeRank is built by two engineering students passionate about helping YouTube creators grow.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 p-6 text-center">
            <img
              src="/moin.jpg"
              alt="Moin Sayyad"
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-4 ring-red-100"
            />
            <h3 className="text-xl font-semibold">Moin Sayyad</h3>
            <p className="text-red-600 text-sm font-medium mt-1">Computer Engineer</p>
            <p className="text-gray-500 text-sm mt-2">CSMSS College of Engineering<br />Chh. Sambhajinagar</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 p-6 text-center">
            <img
              src="/akib.jpg"
              alt="Akib Sayyad"
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-4 ring-red-100"
            />
            <h3 className="text-xl font-semibold">Akib Sayyad</h3>
            <p className="text-red-600 text-sm font-medium mt-1">Artificial Intelligence & Data Science Engineer</p>
            <p className="text-gray-500 text-sm mt-2">CSMSS College of Engineering<br />Chh. Sambhajinagar</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/50 bg-white/50 backdrop-blur py-8 text-center text-sm text-gray-500 mt-auto">
        © 2026 TubeRank • tuberank.in
      </footer>
    </div>
  );
}