"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Channel = {
  id: number;
  name: string;
  url: string;
  category: string;
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

type SearchResult = {
  type: string;
  name: string;
  thumbnail?: string;
};

const PER_PAGE = 10;

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [channelsRes, videosRes] = await Promise.all([
      supabase.from("channels").select("*").order("votes", { ascending: false }),
      supabase.from("videos").select("*").order("votes", { ascending: false }),
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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    
    const channelResults = channels
      .filter((c) => c.name.toLowerCase().includes(query))
      .map((c) => ({ type: "channel", name: c.name, thumbnail: getThumbnail(c.url, c.name) }));
    
    const videoResults = videos
      .filter((v) => v.title.toLowerCase().includes(query) || v.channel_name.toLowerCase().includes(query))
      .map((v) => ({ type: v.is_short ? "short" : "video", name: v.title, thumbnail: v.thumbnail }));
    
    setSearchResults([...channelResults, ...videoResults].slice(0, 10));
  };

  const sponsored = channels.filter((c) => c.is_sponsored);

  const videoCreators = [...new Set(videos.filter((v) => !v.is_short).map((v) => v.channel_name))]
    .map((name) => {
      const creatorVideos = videos.filter((v) => v.channel_name === name && !v.is_short);
      const channel = channels.find((c) => c.name === name);
      return {
        name,
        votes: creatorVideos.reduce((sum, v) => sum + (v.votes || 0), 0),
        count: creatorVideos.length,
        thumbnail: creatorVideos[0]?.thumbnail || null,
        subscribers: channel?.subscribers || null,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  const shortsCreators = [...new Set(videos.filter((v) => v.is_short).map((v) => v.channel_name))]
    .map((name) => {
      const creatorShorts = videos.filter((v) => v.channel_name === name && v.is_short);
      const channel = channels.find((c) => c.name === name);
      return {
        name,
        votes: creatorShorts.reduce((sum, v) => sum + (v.votes || 0), 0),
        count: creatorShorts.length,
        thumbnail: creatorShorts[0]?.thumbnail || null,
        subscribers: channel?.subscribers || null,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  const allCreators = [...videoCreators, ...shortsCreators];
  const totalPages = Math.ceil(Math.max(sponsored.length, videoCreators.length, shortsCreators.length) / PER_PAGE);
  
  const paginatedSponsored = sponsored.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const paginatedVideoCreators = videoCreators.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const paginatedShortsCreators = shortsCreators.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
            <Link href="/sponsored" className="text-sm font-medium text-gray-600 hover:text-black">Sponsored</Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black">About</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Discover & Rank<br />
          <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">YouTube Creators</span>
        </h2>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Vote for your favorite creators • Help small channels grow
        </p>

        <div className="max-w-lg mx-auto mt-8 relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search channels, videos, shorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-5 py-3 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
            />
            <button onClick={handleSearch} className="bg-red-600 text-white px-6 py-3 rounded-full font-medium hover:bg-red-700">
              Search
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border overflow-hidden z-20 text-left">
              {searchResults.map((result, i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-0">
                  {result.thumbnail && <img src={result.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />}
                  <div>
                    <p className="font-medium text-sm">{result.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{result.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Sponsored</h3>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full">Featured</span>
          </div>
          <div className="space-y-2">
            {paginatedSponsored.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No sponsored channels</p>}
            {paginatedSponsored.map((ch, i) => (
              <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-amber-50 rounded-xl transition">
                <span className="text-sm font-semibold text-gray-400 w-5">{(page - 1) * PER_PAGE + i + 1}</span>
                <img src={getThumbnail(ch.url, ch.name)} alt={ch.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{ch.name}</p>
                  <p className="text-xs text-gray-500">{ch.subscribers || "—"} • ▲ {ch.votes || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Video Creators</h3>
            <Link href="/videos" className="text-xs text-red-600 hover:underline">See all</Link>
          </div>
          <div className="space-y-2">
            {paginatedVideoCreators.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No videos yet</p>}
            {paginatedVideoCreators.map((creator, i) => (
              <div key={creator.name} className="flex items-center gap-3 p-2.5 hover:bg-rose-50 rounded-xl transition">
                <span className="text-sm font-semibold text-gray-400 w-5">{(page - 1) * PER_PAGE + i + 1}</span>
                <img src={creator.thumbnail || `https://unavatar.io/youtube/${encodeURIComponent(creator.name)}`} alt={creator.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{creator.name}</p>
                  <p className="text-xs text-gray-500">{creator.subscribers || "—"} • {creator.count} videos • ▲ {creator.votes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Shorts Creators</h3>
            <Link href="/shorts" className="text-xs text-red-600 hover:underline">See all</Link>
          </div>
          <div className="space-y-2">
            {paginatedShortsCreators.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No shorts yet</p>}
            {paginatedShortsCreators.map((creator, i) => (
              <div key={creator.name} className="flex items-center gap-3 p-2.5 hover:bg-purple-50 rounded-xl transition">
                <span className="text-sm font-semibold text-gray-400 w-5">{(page - 1) * PER_PAGE + i + 1}</span>
                <img src={creator.thumbnail || `https://unavatar.io/youtube/${encodeURIComponent(creator.name)}`} alt={creator.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT"; }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{creator.name}</p>
                  <p className="text-xs text-gray-500">{creator.subscribers || "—"} • {creator.count} shorts • ▲ {creator.votes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pb-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-lg font-medium ${page === p ? "bg-red-600 text-white" : "bg-white border hover:bg-gray-50"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      <footer className="border-t bg-white/50 py-8 text-center text-sm text-gray-500">
        © 2026 TubeRank • tuberank.in
      </footer>
    </div>
  );
}