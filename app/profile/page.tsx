"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  isShort: boolean;
};

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [channelUrl, setChannelUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const addChannel = async (handle: string) => {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forHandle=${handle}&key=${apiKey}`);
      const data = await res.json();
      if (data.items?.[0]) {
        const count = parseInt(data.items[0].statistics.subscriberCount);
        const subs = count >= 1000000 ? (count/1000000).toFixed(1) + "M" : count >= 1000 ? (count/1000).toFixed(1) + "K" : count.toString();
        const name = data.items[0].snippet.title;
        setChannelName(name);
        const { data: existing } = await supabase.from("channels").select("id").eq("url", channelUrl).single();
        if (!existing) {
          await supabase.from("channels").insert([{ name, url: channelUrl, subscribers: subs, category: "Entertainment" }]);
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchMyVideos = async () => {
    if (!channelUrl.trim()) return;
    setFetching(true);
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const handleMatch = channelUrl.match(/@([a-zA-Z0-9_.-]+)/);
    const identifier = handleMatch?.[1];
    if (!identifier) { alert("Invalid URL"); setFetching(false); return; }
    await addChannel(identifier);
    try {
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${identifier}&key=${apiKey}`);
      const channelData = await channelRes.json();
      const channelId = channelData.items?.[0]?.id;
      if (!channelId) { setFetching(false); return; }
      const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=20&key=${apiKey}`);
      const videosData = await videosRes.json();
      const videoIds = videosData.items?.map((v: any) => v.id.videoId).join(",");
      if (videoIds) {
        const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`);
        const detailsData = await detailsRes.json();
        const parsed = detailsData.items?.map((v: any) => {
          const duration = v.contentDetails.duration;
          const isShort = duration.includes("PT") && !duration.includes("M") && parseInt(duration.replace(/\D/g, "")) <= 60;
          return { id: v.id, title: v.snippet.title, thumbnail: v.snippet.thumbnails.medium?.url, isShort };
        }) || [];
        setVideos(parsed);
      }
    } catch (err) { console.error(err); }
    setFetching(false);
  };

  const addToRank = async (video: YouTubeVideo) => {
    const { error } = await supabase.from("videos").insert([{
      title: video.title,
      url: `https://youtube.com/watch?v=${video.id}`,
      video_id: video.id,
      thumbnail: video.thumbnail,
      channel_name: channelName || "Unknown",
      category: video.isShort ? "Shorts" : "Entertainment",
      is_short: video.isShort,
    }]);
    if (error) alert("Error: " + error.message);
    else alert("Added!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-orange-50">
        <div className="text-center">
          <p className="mb-4">Please login first</p>
          <Link href="/login" className="bg-red-600 text-white px-6 py-2 rounded-lg">Login</Link>
        </div>
      </div>
    );
  }

  const shorts = videos.filter((v) => v.isShort);
  const regularVideos = videos.filter((v) => !v.isShort);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <header className="bg-white/70 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold">TubeRank</h1>
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black">Dashboard</Link>
            <Link href="/videos" className="text-sm font-medium text-gray-600 hover:text-black">Videos</Link>
            <Link href="/shorts" className="text-sm font-medium text-gray-600 hover:text-black">Shorts</Link>
            <Link href="/profile" className="text-sm font-medium text-red-600">Profile</Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold">{user.user_metadata?.full_name || "User"}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-8">
          <h3 className="font-semibold mb-4">Add Your Content</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="YouTube channel URL (youtube.com/@yourchannel)"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              className="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button onClick={fetchMyVideos} disabled={fetching} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50">
              {fetching ? "Fetching..." : "Fetch"}
            </button>
          </div>
          {channelName && <p className="text-sm text-gray-500 mt-2">Channel: {channelName}</p>}
        </div>

        {regularVideos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
            <h3 className="font-semibold mb-4">Your Videos ({regularVideos.length})</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {regularVideos.map((video) => (
                <div key={video.id} className="flex gap-3 p-3 border rounded-xl">
                  <img src={video.thumbnail} alt="" className="w-32 h-20 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                    <button onClick={() => addToRank(video)} className="mt-2 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Add to Rank</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shorts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h3 className="font-semibold mb-4">Your Shorts ({shorts.length})</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {shorts.map((video) => (
                <div key={video.id} className="border rounded-xl overflow-hidden">
                  <img src={video.thumbnail} alt="" className="w-full aspect-[9/16] object-cover" />
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                    <button onClick={() => addToRank(video)} className="mt-2 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 w-full">Add to Rank</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}