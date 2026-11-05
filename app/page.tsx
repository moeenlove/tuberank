"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const categories = ["All", "Gaming", "Education", "Music", "Tech", "Vlogs", "Finance", "Comedy"];

type Channel = {
  id: number;
  name: string;
  url: string;
  category: string;
  subscribers: string | null;
  votes: number;
  is_sponsored: boolean;
  created_at: string;
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("votes", { ascending: false });

    if (!error && data) {
      setChannels(data);
    }
    setLoading(false);
  };

  const handleVote = async (id: number) => {
    const channel = channels.find((c) => c.id === id);
    if (!channel) return;

    const newVotes = (channel.votes || 0) + 1;

    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: newVotes } : c))
    );

    await supabase.from("channels").update({ votes: newVotes }).eq("id", id);
  };

  const getThumbnail = (url: string, name: string) => {
    const handle = url?.split("@")[1]?.split("/")[0] || name;
    return `https://unavatar.io/youtube/${handle}`;
  };

  const sponsored = channels.filter((c) => c.is_sponsored === true).slice(0, 10);
  const voted = channels.filter((c) => {
    if (c.is_sponsored === true) return false;
    if (activeCategory === "All") return true;
    return c.category === activeCategory;
  });

  // Rising = recently added channels (last 7 days), sorted by votes
  const rising = [...channels]
    .filter((c) => {
      const created = new Date(c.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    })
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold text-gray-900">TubeRank</h1>
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-gray-600 hover:text-black text-sm font-medium">
              Login
            </Link>
            <Link href="/submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
              Submit Channel
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Discover & Rank<br />YouTube Channels</h2>
        <p className="text-gray-600 text-lg">Vote for channels • Daily Rankings • Sponsored Visibility</p>
      </section>

      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeCategory === cat ? "bg-red-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
        {/* Sponsored */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sponsored</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Top 10</span>
            </div>
            <div className="space-y-3">
              {sponsored.length === 0 && <p className="text-sm text-gray-500">No sponsored channels yet</p>}
              {sponsored.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500">{ch.subscribers || "—"} • {ch.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Voted + Rising */}
        <div className="md:col-span-2 space-y-6">
          {/* Top Voted */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top Voted Today</h3>
              <span className="text-sm text-gray-500">{activeCategory}</span>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                {voted.length === 0 && <p className="text-sm text-gray-500">No channels yet.</p>}
                {voted.map((ch, i) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl border">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-gray-300 w-8">{i + 1}</span>
                      <img
                        src={getThumbnail(ch.url, ch.name)}
                        alt={ch.name}
                        className="w-12 h-12 rounded-full flex-shrink-0 object-cover bg-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/48?text=YT";
                        }}
                      />
                      <div>
                        <p className="font-medium">{ch.name}</p>
                        <p className="text-sm text-gray-500">{ch.category} • {ch.subscribers || "—"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVote(ch.id)}
                      className="flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-200 font-medium"
                    >
                      ▲ {(ch.votes || 0).toLocaleString()}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rising Channels */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-semibold mb-4">Rising Channels</h3>
            <div className="space-y-3">
              {rising.length === 0 && <p className="text-sm text-gray-500">No new channels this week</p>}
              {rising.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500">{ch.category} • ▲ {ch.votes || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        © 2026 TubeRank • tuberank.in
      </footer>
    </div>
  );
}