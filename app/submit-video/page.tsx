"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function SubmitVideo() {
  const [form, setForm] = useState({
    title: "",
    url: "",
    category: "Entertainment",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const fetchVideoDetails = async (videoId: string) => {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          views: formatCount(item.statistics.viewCount),
          likes: formatCount(item.statistics.likeCount),
        };
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const formatCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const videoId = extractVideoId(form.url);
    if (!videoId) {
      setMessage("Invalid YouTube URL");
      setLoading(false);
      return;
    }

    setMessage("Fetching video details...");
    const details = await fetchVideoDetails(videoId);

    const { error } = await supabase.from("videos").insert([
      {
        title: details?.title || form.title,
        url: form.url,
        video_id: videoId,
        thumbnail: details?.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        channel_name: details?.channelName || "",
        category: form.category,
        views: details?.views || null,
        likes: details?.likes || null,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Video submitted successfully!");
      setForm({ title: "", url: "", category: "Entertainment" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold">TubeRank</h1>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-black">← Back to Home</Link>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Submit a Video</h2>
          <p className="text-gray-600">Add a YouTube video to the rankings</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Video Title (optional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Will be fetched automatically"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">YouTube Video URL</label>
            <input
              type="url"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 mt-1">Thumbnail, views, likes will be fetched automatically</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option>Entertainment</option>
              <option>Gaming</option>
              <option>Education</option>
              <option>Music</option>
              <option>Tech</option>
              <option>Vlogs</option>
              <option>Finance</option>
              <option>Comedy</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-lg font-medium hover:from-red-600 hover:to-rose-700 disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Submit Video"}
          </button>

          {message && (
            <p className={`text-sm text-center font-medium ${message.includes("Error") || message.includes("Invalid") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}