"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const categories = ["All", "Music", "Gaming", "Entertainment", "Education", "Comedy", "Sports", "Science & Tech", "Howto & Style", "News", "Film & Animation"];

const categoryMap: { [key: string]: string } = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
};

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

type SearchResult = {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  type: "channel" | "video";
  url: string;
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState("Entertainment");
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchVideos();
    
    const challengeCategories = ["Music", "Gaming", "Entertainment", "Education", "Comedy", "Sports", "Science & Tech", "Howto & Style"];
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const categoryIndex = weekNumber % challengeCategories.length;
    setCurrentChallenge(challengeCategories[categoryIndex]);

    const updateTimeLeft = () => {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      const diff = endOfWeek.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
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

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`)}`
      );
      const text = await res.text();
      const match = text.match(/\[.*\]/);
      if (match) {
        const json = JSON.parse(match[0]);
        if (json[1]) {
          setSuggestions(json[1].slice(0, 6));
          setShowSuggestions(true);
        }
      }
    } catch (err) {
      console.error("Suggestion error:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowSuggestions(false);

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    try {
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=5&key=${apiKey}`
      );
      const channelData = await channelRes.json();

      const videoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(searchQuery)}&maxResults=5&key=${apiKey}`
      );
      const videoData = await videoRes.json();

      const results: SearchResult[] = [
        ...(channelData.items || []).map((item: any) => ({
          id: item.id.channelId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.default?.url || "",
          channelName: item.snippet.title,
          type: "channel" as const,
          url: `https://youtube.com/channel/${item.id.channelId}`,
        })),
        ...(videoData.items || []).map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "",
          channelName: item.snippet.channelTitle,
          type: "video" as const,
          url: `https://youtube.com/watch?v=${item.id.videoId}`,
        })),
      ];

      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    }
    setSearching(false);
  };

  const addToRank = async (result: SearchResult) => {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    if (result.type === "channel") {
      let subscribers = null;

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${result.id}&key=${apiKey}`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const count = parseInt(data.items[0].statistics.subscriberCount);
          subscribers = formatSubscribers(count);
        }
      } catch (err) {
        console.error(err);
      }

      const categoryInput = prompt("Select category:\n1. Music\n2. Gaming\n3. Entertainment\n4. Education\n5. Comedy\n6. Sports\n7. Science & Tech\n8. Howto & Style\n9. News\n10. Film & Animation\n\nEnter number:", "3");
      const categoryOptions = ["Music", "Gaming", "Entertainment", "Education", "Comedy", "Sports", "Science & Tech", "Howto & Style", "News", "Film & Animation"];
      const selectedCategory = categoryOptions[parseInt(categoryInput || "3") - 1] || "Entertainment";

      const { error } = await supabase.from("channels").insert([{
        name: result.title,
        url: result.url,
        category: selectedCategory,
        subscribers: subscribers,
      }]);
      if (error) {
        alert("Error adding channel: " + error.message);
        return;
      }
    } else {
      let views = null;
      let likes = null;
      let thumbnail = result.thumbnail;
      let category = "Entertainment";

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${result.id}&key=${apiKey}`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const stats = data.items[0].statistics;
          const snippet = data.items[0].snippet;
          views = formatSubscribers(parseInt(stats.viewCount || "0"));
          likes = formatSubscribers(parseInt(stats.likeCount || "0"));
          thumbnail = snippet.thumbnails.medium?.url || thumbnail;
          category = categoryMap[snippet.categoryId] || "Entertainment";
        }
      } catch (err) {
        console.error(err);
      }

      const { error } = await supabase.from("videos").insert([{
        title: result.title,
        url: result.url,
        video_id: result.id,
        thumbnail: thumbnail,
        channel_name: result.channelName,
        category: category,
        views: views,
        likes: likes,
      }]);
      if (error) {
        alert("Error adding video: " + error.message);
        return;
      }
    }

    setSearchResults([]);
    setSearchQuery("");
    fetchChannels();
    fetchVideos();
    alert("Added to rankings!");
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
    const handleMatch = url?.match(/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
      return `https://unavatar.io/youtube/${handleMatch[1]}`;
    }
    
    const channelMatch = url?.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return `https://unavatar.io/youtube/${channelMatch[1]}`;
    }
    
    return `https://unavatar.io/youtube/${encodeURIComponent(name)}`;
  };

  const parseSubs = (s: string | null): number => {
    if (!s) return 0;
    const num = parseFloat(s);
    if (s.toLowerCase().includes("m")) return num * 1000000;
    if (s.toLowerCase().includes("k")) return num * 1000;
    return num;
  };

  const sponsored = channels.filter((c) => c.is_sponsored === true).slice(0, 10);

  const voted = channels.filter((c) => {
    if (c.is_sponsored === true) return false;
    if (activeCategory !== "All" && c.category !== activeCategory) return false;
    return true;
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

  const risingStars = channels.filter((c) => {
    if (!c.subscribers) return false;
    const sub = c.subscribers.toLowerCase();
    if (sub.includes("m")) return false;
    if (sub.includes("k")) {
      const num = parseFloat(sub.replace("k", ""));
      return num < 100;
    }
    return parseInt(sub) < 100000;
  }).slice(0, 5);

  const topBySubs = [...channels]
    .filter((c) => c.subscribers)
    .sort((a, b) => parseSubs(b.subscribers) - parseSubs(a.subscribers))
    .slice(0, 5);

  const challengeChannels = channels
    .filter((c) => c.category === currentChallenge)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-white/50 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">T</div>
            <h1 className="text-2xl font-bold tracking-tight">TubeRank</h1>
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => {
                document.documentElement.classList.toggle("dark");
                localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm font-medium px-3 py-2"
            >
              🌙
            </button>
            <Link href="/profile" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm font-medium px-3 py-2">
              Profile
            </Link>
            <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm font-medium px-3 py-2">
              About
            </Link>
            <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm font-medium px-3 py-2">
              Login
            </Link>
            <Link href="/submit-video" className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition">
              Submit Video
            </Link>
            <Link href="/submit" className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:from-red-600 hover:to-rose-700 shadow-md transition">
              Submit Channel
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Discover & Rank<br />
          <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">YouTube Channels</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Vote for your favorite channels • Daily rankings • Sponsored visibility
        </p>

        <div className="max-w-lg mx-auto relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search YouTube channels or videos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchSuggestions(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="flex-1 px-5 py-3 rounded-full border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm dark:text-white"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-red-600 text-white px-6 py-3 rounded-full font-medium hover:bg-red-700 disabled:opacity-50 transition"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-16 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden z-20">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchQuery(s);
                    setShowSuggestions(false);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg border dark:border-gray-700 p-4 text-left">
              <h4 className="font-medium mb-3 text-sm text-gray-500 dark:text-gray-400">Search Results</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={result.thumbnail} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.type === "channel" ? "Channel" : "Video"} • {result.channelName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToRank(result)}
                      className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 whitespace-nowrap ml-2"
                    >
                      Add to Rank
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">🏆 Weekly Challenge</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">Best {currentChallenge} Channel This Week</p>
            </div>
            <div className="text-right">
              <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs px-3 py-1 rounded-full font-medium">
                {currentChallenge}
              </span>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-mono font-bold">{timeLeft}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {challengeChannels.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 col-span-3 text-center py-4">No {currentChallenge} channels yet. Be the first!</p>
            )}
            {challengeChannels.map((ch, i) => (
              <div key={ch.id} className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg font-bold text-amber-500">{i + 1}</span>
                <img
                  src={getThumbnail(ch.url, ch.name)}
                  alt={ch.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{ch.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{ch.subscribers || "—"} • ▲ {ch.votes || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition shadow-sm ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                  : "bg-white/80 dark:bg-gray-700/80 backdrop-blur border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sponsored</h3>
              <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">Top 10</span>
            </div>
            <div className="space-y-2">
              {sponsored.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No sponsored channels yet</p>}
              {sponsored.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-rose-50/50 dark:hover:bg-gray-700/50 rounded-xl transition">
                  <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ch.subscribers || "—"} • {ch.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-5">
            <h3 className="font-semibold mb-4">Rising Channels</h3>
            <div className="space-y-2">
              {rising.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No new channels this week</p>}
              {rising.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-rose-50/50 dark:hover:bg-gray-700/50 rounded-xl transition">
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ch.category} • {ch.subscribers || "—"} • ▲ {ch.votes || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Rising Stars</h3>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2.5 py-1 rounded-full font-medium">Under 100K</span>
            </div>
            <div className="space-y-2">
              {risingStars.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No rising stars yet</p>}
              {risingStars.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-green-50/50 dark:hover:bg-gray-700/50 rounded-xl transition">
                  <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ch.subscribers} • {ch.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top Channels</h3>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2.5 py-1 rounded-full font-medium">By Subs</span>
            </div>
            <div className="space-y-2">
              {topBySubs.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No channels yet</p>}
              {topBySubs.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-3 p-2.5 hover:bg-purple-50/50 dark:hover:bg-gray-700/50 rounded-xl transition">
                  <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                  <img
                    src={getThumbnail(ch.url, ch.name)}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=YT";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ch.subscribers} • {ch.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top Voted Today</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{activeCategory}</span>
            </div>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Loading channels...</p>
            ) : (
              <div className="space-y-2">
                {voted.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No channels found.</p>}
                {voted.map((ch, i) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 hover:bg-rose-50/50 dark:hover:bg-gray-700/50 rounded-xl border border-transparent hover:border-rose-100 dark:hover:border-gray-600 transition">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-gray-300 dark:text-gray-600 w-8">{i + 1}</span>
                      <img
                        src={getThumbnail(ch.url, ch.name)}
                        alt={ch.name}
                        className="w-12 h-12 rounded-full object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/48?text=YT";
                        }}
                      />
                      <div>
                        <p className="font-medium">{ch.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{ch.category} • {ch.subscribers || "—"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVote(ch.id)}
                      className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-600 px-3.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 hover:border-red-200 font-medium transition bg-white dark:bg-gray-700"
                    >
                      ▲ {(ch.votes || 0).toLocaleString()}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700 p-5">
            <h3 className="font-semibold mb-4">Top Videos</h3>
            {videos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No videos yet.</p>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.channel_name} • {video.views || "—"} views</p>
                      <button
                        onClick={() => handleVideoVote(video.id)}
                        className="mt-2 text-xs border dark:border-gray-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-gray-700"
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

      <footer className="border-t border-white/50 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        © 2026 TubeRank • tuberank.in
      </footer>
    </div>
  );
}