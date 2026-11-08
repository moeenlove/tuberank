"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

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
  is_short: boolean;
  is_sponsored?: boolean;
};

const PER_PAGE = 20;

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{video: Video; rank: number} | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_short", false)
      .order("votes", { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const handleVote = async (id: number) => {
    const video = videos.find((v) => v.id === id);
    if (!video) return;

    const newVotes = (video.votes || 0) + 1;
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, votes: newVotes } : v)));
    await supabase.from("videos").update({ votes: newVotes }).eq("id", id);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    const query = searchQuery.toLowerCase();
    const ranked = videos.filter((v) => !v.is_sponsored);
    const index = ranked.findIndex((v) => v.title.toLowerCase().includes(query) || v.channel_name.toLowerCase().includes(query));
    if (index !== -1) {
      setSearchResult({ video: ranked[index], rank: index + 1 });
    } else {
      setSearchResult(null);
      alert("Not found");
    }
  };

  const sponsored = videos.filter((v) => v.is_sponsored).slice(0, 5);
  const ranked = videos.filter((v) => !v.is_sponsored);
  const totalPages = Math.ceil(ranked.length / PER_PAGE);
  const paginatedVideos = ranked.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
            <Link href="/videos" className="text-sm font-medium text-red-600">Videos</Link>
            <Link href="/shorts" className="text-sm font-medium text-gray-600 hover:text-black">Shorts</Link>
            <Link href="/sponsored" className="text-sm font-medium text-gray-600 hover:text-black">Sponsored</Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black">About</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">Login</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Top Videos</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search video or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button onClick={handleSearch} className="bg-red-600 text-white px-4 py-2 rounded-lg">Search</button>
          </div>
        </div>

        {searchResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>{searchResult.video.title}</strong> is ranked <strong>#{searchResult.rank}</strong> with <strong>{searchResult.video.votes || 0}</strong> votes
            </p>
          </div>
        )}

        {sponsored.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 mb-8">
            <h3 className="font-semibold text-amber-900 mb-4">Sponsored</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {sponsored.map((video) => (
                <div key={video.id} className="bg-white rounded-xl p-3">
                  <img src={video.thumbnail} alt="" className="w-full aspect-video object-cover rounded-lg mb-2" />
                  <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{video.channel_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : ranked.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No videos yet.</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {paginatedVideos.map((video, i) => (
                <div key={video.id} className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                  <div className="relative">
                    <span className="absolute top-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full z-10">
                      #{(page - 1) * PER_PAGE + i + 1}
                    </span>
                    
                    {playingVideo === video.video_id ? (
                      <div className="aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div
                        className="aspect-video cursor-pointer relative group"
                        onClick={() => setPlayingVideo(video.video_id)}
                      >
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl">▶</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="font-medium line-clamp-2">{video.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{video.channel_name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>👁 {video.views || "—"}</span>
                        <span>👍 {video.likes || "—"}</span>
                      </div>
                      <button
                        onClick={() => handleVote(video.id)}
                        className="text-sm border px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-200 font-medium"
                      >
                        ▲ {(video.votes || 0).toLocaleString()}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg font-medium ${page === p ? "bg-red-600 text-white" : "bg-white border hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}