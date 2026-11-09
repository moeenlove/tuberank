"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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
  is_short: boolean;
};

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setUser(session.user);
  };

  const fetchData = async () => {
    const [channelsRes, videosRes] = await Promise.all([
      supabase.from("channels").select("*"),
      supabase.from("videos").select("*").order("votes", { ascending: false }),
    ]);
    if (channelsRes.data) setChannels(channelsRes.data);
    if (videosRes.data) setVideos(videosRes.data);
    setLoading(false);
  };

  const getThumbnail = (url: string, name: string) => {
    const handleMatch = url?.match(/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) return `https://unavatar.io/youtube/${handleMatch[1]}`;
    return `https://unavatar.io/youtube/${encodeURIComponent(name)}`;
  };

  const sponsored = channels.filter((c) => c.is_sponsored).slice(0, 5);

  const videoChannels = [...new Set(videos.filter((v) => !v.is_short).map((v) => v.channel_name))]
    .map((name) => {
      const channelVideos = videos.filter((v) => v.channel_name === name && !v.is_short);
      const channel = channels.find((c) => c.name === name);
      return { name, votes: channelVideos.reduce((sum, v) => sum + (v.votes || 0), 0), count: channelVideos.length, thumbnail: channelVideos[0]?.thumbnail, subscribers: channel?.subscribers, url: channel?.url };
    })
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  const shortsChannels = [...new Set(videos.filter((v) => v.is_short).map((v) => v.channel_name))]
    .map((name) => {
      const channelShorts = videos.filter((v) => v.channel_name === name && v.is_short);
      const channel = channels.find((c) => c.name === name);
      return { name, votes: channelShorts.reduce((sum, v) => sum + (v.votes || 0), 0), count: channelShorts.length, thumbnail: channelShorts[0]?.thumbnail, subscribers: channel?.subscribers, url: channel?.url };
    })
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

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
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black">About</Link>
            {user ? (
              <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-black">{user.user_metadata?.full_name?.split(" ")[0] || "Profile"}</Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-2">Discover & Rank</h2>
          <p className="text-xl bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent font-bold">YouTube Creators</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Sponsored</h3>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full">Featured</span>
              </div>
              <div className="space-y-2">
                {sponsored.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No sponsored channels</p>}
                {sponsored.map((ch, i) => (
                  <div key={ch.id} className="flex items-center gap-3 p-2 hover:bg-amber-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                    <img src={getThumbnail(ch.url, ch.name)} alt={ch.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.subscribers || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top Video Channels</h3>
                <Link href="/videos" className="text-xs text-red-600 hover:underline">See all</Link>
              </div>
              <div className="space-y-2">
                {videoChannels.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No videos yet</p>}
                {videoChannels.map((ch, i) => (
                  <div key={ch.name} className="flex items-center gap-3 p-2 hover:bg-rose-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                    <img src={ch.thumbnail || getThumbnail(ch.url || "", ch.name)} alt={ch.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.subscribers || "—"} • {ch.count} videos • ▲ {ch.votes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top Shorts Channels</h3>
                <Link href="/shorts" className="text-xs text-red-600 hover:underline">See all</Link>
              </div>
              <div className="space-y-2">
                {shortsChannels.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No shorts yet</p>}
                {shortsChannels.map((ch, i) => (
                  <div key={ch.name} className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                    <img src={ch.thumbnail || getThumbnail(ch.url || "", ch.name)} alt={ch.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.subscribers || "—"} • {ch.count} shorts • ▲ {ch.votes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t bg-white/50 py-8 text-center text-sm text-gray-500 mt-8">
        © 2026 TubeRank • tuberank.in
      </footer>
    </div>
  );
}