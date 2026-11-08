"use client";

import Link from "next/link";

export default function SponsoredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold">TubeRank</h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black">Dashboard</Link>
            <Link href="/videos" className="text-sm font-medium text-gray-600 hover:text-black">Videos</Link>
            <Link href="/shorts" className="text-sm font-medium text-gray-600 hover:text-black">Shorts</Link>
            <Link href="/sponsored" className="text-sm font-medium text-red-600">Sponsored</Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black">About</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-4">Get Sponsored</h2>
        <p className="text-gray-600 text-center mb-12">Boost your visibility with sponsored placements</p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Entry */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h3 className="text-xl font-bold mb-2">Entry</h3>
            <p className="text-3xl font-bold text-red-600 mb-4">₹2,000<span className="text-sm text-gray-500 font-normal">/week</span></p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>✓ Position 8-10</li>
              <li>✓ 1 week placement</li>
              <li>✓ Homepage visibility</li>
            </ul>
            <button className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
              Coming Soon
            </button>
          </div>

          {/* Mid */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-500 p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full">Popular</span>
            <h3 className="text-xl font-bold mb-2">Mid</h3>
            <p className="text-3xl font-bold text-red-600 mb-4">₹5,000<span className="text-sm text-gray-500 font-normal">/week</span></p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>✓ Position 4-7</li>
              <li>✓ 1 week placement</li>
              <li>✓ Homepage + Category</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700">
              Coming Soon
            </button>
          </div>

          {/* Premium */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-3xl font-bold text-red-600 mb-4">₹15,000<span className="text-sm text-gray-500 font-normal">/week</span></p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>✓ Position 1-3</li>
              <li>✓ 1 week placement</li>
              <li>✓ All pages visibility</li>
              <li>✓ Featured badge</li>
              <li>✓ Analytics report</li>
            </ul>
            <button className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
              Coming Soon
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Payment integration coming soon. Contact us for early access.
        </p>
      </div>
    </div>
  );
}