"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function SubmitChannel() {
  const [form, setForm] = useState({
    channelName: "",
    channelUrl: "",
    category: "Gaming",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("channels").insert([
      {
        name: form.channelName,
        url: form.channelUrl,
        category: form.category,
        description: form.description,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Channel successfully submitted!");
      setForm({ channelName: "", channelUrl: "", category: "Gaming", description: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-2xl font-bold">TubeRank</h1>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-black">← Back to Home</Link>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-2">Submit Your Channel</h2>
        <p className="text-gray-600 mb-8">Apna YouTube channel add karo ranking mein</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Channel Name</label>
            <input
              type="text"
              required
              value={form.channelName}
              onChange={(e) => setForm({ ...form, channelName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Tech Burner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">YouTube Channel URL</label>
            <input
              type="url"
              required
              value={form.channelUrl}
              onChange={(e) => setForm({ ...form, channelUrl: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="https://youtube.com/@channel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option>Gaming</option>
              <option>Education</option>
              <option>Music</option>
              <option>Tech</option>
              <option>Vlogs</option>
              <option>Finance</option>
              <option>Comedy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Channel ke baare mein 1-2 line..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Channel"}
          </button>

          {message && (
            <p className={`text-sm text-center ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}