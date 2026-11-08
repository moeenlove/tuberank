"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

type Channel = {
  id: number;
  name: string;
  url: string;
  subscribers: string | null;
  votes: number;
  is_sponsored: boolean;
};

type Video = {
  id: number;
  title: string;
  thumbnail: string;
  channel_name: string;
  votes: number;
  views: string | null;
  likes: string | null;
  is_short: boolean;
};

export default function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [channelsRes, videosRes] = await Promise.all([
      supabase.from("channels").select("*").order("votes", { ascending: false }).limit(10),
      supabase.from("videos").select("*").order("votes", { ascending: false }).limit(10),
    ]);
    if (channelsRes.data) setChannels(channelsRes.data);
    if (videosRes.data) setVideos(videosRes.data);
    setLoading(false);
  };

  const getThumbnail = (url: string, name: string) => {
    const handleMatch = url?.match(/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) return `https://unavatar.io/youtube/${handleMatch[1]}`;
    const channelMatch = url?.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (channelMatch) return `https://unavatar.io/youtube/${channelMatch[1]}`;
    return `https://unavatar.io/youtube/${encodeURIComponent(name)}`;
  };

  const topVideos = videos.filter((v) => !v.is_short).slice(0, 5);
  const topShorts = videos.filter((v) => v.is_short).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold">TubeRank</h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-red-600">Dashboard</Link>
            <Link href="/videos" className="text-sm font-medium text-gray-600 hover:text-black">Videos</Link>
            <Link href="/shorts" className="text-sm font-medium text-gray-600 hover:text-black">Shorts</Link>
            <Link href="/sponsored" className="text-sm font-medium text-gray-600 hover:text-black">Sponsored</Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black">About</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <h3 className="font-semibold mb-4">Top Channels</h3>
              <div className="space-y-2">
                {channels.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No channels yet</p>}
                {channels.slice(0, 5).map((ch, i) => (
                  <div key={ch.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                    <img 
                      src={getThumbnail(ch.url, ch.name)} 
                      alt={ch.name} 
                      className="w-10 h-10 rounded-full object-cover bg-gray-100" 
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.subscribers || "—"} • ▲ {ch.votes || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <h3 className="font-semibold mb-4">Top Videos</h3>
              <div className="space-y-2">
                {topVideos.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No videos yet</p>}
                {topVideos.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                    <img src={v.thumbnail} alt="" className="w-16 h-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{v.title}</p>
                      <p className="text-xs text-gray-500">{v.channel_name}</p>
                      <p className="text-xs text-gray-400">👁 {v.views || "—"} • 👍 {v.likes || "—"} • ▲ {v.votes || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <h3 className="font-semibold mb-4">Top Shorts</h3>
              <div className="space-y-2">
                {topShorts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No shorts yet</p>}
                {topShorts.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                    <img src={v.thumbnail} alt="" className="w-10 h-14 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{v.title}</p>
                      <p className="text-xs text-gray-500">{v.channel_name}</p>
                      <p className="text-xs text-gray-400">👁 {v.views || "—"} • 👍 {v.likes || "—"} • ▲ {v.votes || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}