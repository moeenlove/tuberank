"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const categories = ["All", "Gaming", "Education", "Music", "Tech", "Vlogs", "Finance", "Comedy", "Entertainment"];

const youtubeGiants = [
  { name: "MrBeast", handle: "MrBeast", category: "Entertainment" },
  { name: "T-Series", handle: "tseries", category: "Music" },
  { name: "Cocomelon", handle: "cocomelon", category: "Education" },
  { name: "SET India", handle: "setindia", category: "Entertainment" },
  { name: "Vlad and Niki", handle: "VladandNiki", category: "Entertainment" },
];

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

type Video = {
  id: number;
  title: string;
  url: string;
  video_id: string;
  thumbnail: string;
  channel_name: string;
  category: string;
  views: string | null;
  likes: string | null;
  votes: number;
};

type Giant = {
  name: string;
  handle: string;
  category: string;
  subscribers: string | null;
  thumbnail: string;
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [giants, setGiants] = useState<Giant[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
    fetchVideos();
    fetchGiants();
  }, []);

  const formatSubscribers = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const fetchSubscriberCount = async (handle: string): Promise<string | null> => {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${handle}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const count = parseInt(data.items[0].statistics.subscriberCount);
        return formatSubscribers(count);
      }
    } catch (err) {
      console.error("Error fetching:", handle, err);
    }
    return null;
  };

  const fetchGiants = async () => {
    const results = await Promise.all(
      youtubeGiants.map(async (g) => {
        const subs = await fetchSubscriberCount(g.handle);
        return {
          ...g,
          subscribers: subs,
          thumbnail: `https://unavatar.io/youtube/${g.handle}`,
        };
      })
    );
    setGiants(results);
  };

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("votes", { ascending: false });

    if (!error && data) {
      const updated = await Promise.all(
        data.map(async (ch) => {
          if (!ch.subscribers && ch.url) {
            const handleMatch = ch.url.match(/@([a-zA-Z0-9_.-]+)/);
            if (handleMatch) {
              const subs = await fetchSubscriberCount(handleMatch[1]);
              if (subs) {
                await supabase.from("channels").update({ subscribers: subs }).eq("id", ch.id);
                return { ...ch, subscribers: subs };
              }
            }
          }
          return ch;
        })
      );
      setChannels(updated);
    }
    setLoading(false);
  };

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("votes", { ascending: false })
      .limit(6);

    if (!error && data) {
      setVideos(data);
    }
  };

  const handleVote = async (id: number) => {
    const channel = channels.find((c) => c.id === id);
    if (!channel) return;

    const newVotes = (channel.votes || 0) + 1;

    // Update local state
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: newVotes } : c))
    );

    // Update database
    const { error } = await supabase
      .from("channels")
      .update({ votes: newVotes })
      .eq("id", id);

    if (error) {
      console.error("Vote update error:", error);
    }
  };

  const handleVideoVote = async (id: number) => {
    const video = videos.find((v) => v.id === id);
    if (!video) return;

    const newVotes = (video.votes || 0) + 1;

    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, votes: newVotes } : v))
    );

    await supabase.from("videos").update({ votes: newVotes }).eq("id", id);
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">T</div>
            <h1 className="text-2xl font-bold tracking-tight">TubeRank</h1>
          </Link>
          <div className="flex gap-3">
            <Link href="/about" className="text-gray-600 hover:text-black text-sm font-medium px-3 py-2">
              About
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-black text-sm font-medium px-3 py-2">
              Login
            </Link>
            <Link href="/submit-video" className="bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Submit Video
            </Link>
            <Link href="/submit" className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:from-red-600 hover:to-rose-700 shadow-md transition">
              Submit Channel
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Discover & Rank<br />
          <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">YouTube Channels</span>
        </h2>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Vote for your favorite channels • Daily rankings • Sponsored visibility
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition shadow-sm ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                  : "bg-white/80 backdrop-blur border border-gray-200 text-gray-700 hover:bg-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Sponsored */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sponsored</h3>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Top 10</span>
            </div>
            <div className="space-y-2">
              {sponsored.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No sponsored channels yet</p>}
              {sponsored.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-rose-50/50 rounded-xl transition">
                  <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white"
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

          {/* Rising Channels */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-5">
            <h3 className="font-semibold mb-4">Rising Channels</h3>
            <div className="space-y-2">
              {rising.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No new channels this week</p>}
              {rising.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-rose-50/50 rounded-xl transition">
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500">{ch.category} • {ch.subscribers || "—"} • ▲ {ch.votes || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* YouTube Giants */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">YouTube Giants</h3>
              <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-medium">All-Time</span>
            </div>
            <div className="space-y-2">
              {giants.map((g, i) => (
                <div key={g.handle} className="flex items-center gap-3 p-2.5 hover:bg-purple-50/50 rounded-xl transition">
                  <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                  <img
                    src={g.thumbnail}
                    alt={g.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.subscribers || "Loading..."} • {g.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Top Voted Today */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top Voted Today</h3>
              <span className="text-sm text-gray-500">{activeCategory}</span>
            </div>
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading channels...</p>
            ) : (
              <div className="space-y-2">
                {voted.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No channels yet.</p>}
                {voted.map((ch, i) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 hover:bg-rose-50/50 rounded-xl border border-transparent hover:border-rose-100 transition">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-gray-300 w-8">{i + 1}</span>
                      <img
                        src={getThumbnail(ch.url, ch.name)}
                        alt={ch.name}
                        className="w-12 h-12 rounded-full object-cover bg-gray-100 ring-2 ring-white"
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
                      className="flex items-center gap-1.5 text-sm border border-gray-200 px-3.5 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-200 font-medium transition bg-white"
                    >
                      ▲ {(ch.votes || 0).toLocaleString()}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Videos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-5">
            <h3 className="font-semibold mb-4">Top Videos</h3>
            {videos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No videos yet. Be the first to submit!</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="group">
                    {playingVideo === video.video_id ? (
                      <div className="aspect-video rounded-xl overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => setPlayingVideo(video.video_id)}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">▶</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{video.channel_name} • {video.views || "—"} views</p>
                      <button
                        onClick={() => handleVideoVote(video.id)}
                        className="mt-2 text-xs border px-2 py-1 rounded hover:bg-red-50"
                      >
                        ▲ {video.votes || 0}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/50 bg-white/50 backdrop-blur py-8 text-center text-sm text-gray-500">
        © 2026 TubeRank • tuberank.in
      </footer>
    </div>
  );
}