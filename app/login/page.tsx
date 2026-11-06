"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/login",
      });
      if (error) setMessage(error.message);
      else setMessage("Password reset link sent to your email!");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, age },
        },
      });
      if (error) {
        setMessage(error.message);
      } else {
        // Direct login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) setMessage(loginError.message);
        else window.location.href = "/";
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <span className="text-xl font-bold">TubeRank</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-black">← Back</Link>
        </div>

        <h2 className="text-2xl font-bold mb-6">
          {isForgot ? "Reset Password" : isSignUp ? "Create Account" : "Login"}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </>
          )}

          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {!isForgot && (
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-2.5 rounded-lg font-medium hover:from-red-600 hover:to-rose-700 disabled:opacity-50 transition"
          >
            {loading ? "Please wait..." : isForgot ? "Send Reset Link" : isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm text-center ${message.includes("sent") || message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <div className="mt-4 space-y-2 text-center">
          {!isForgot && (
            <button
              onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
              className="text-sm text-red-600 hover:underline block w-full"
            >
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          )}

          {!isSignUp && (
            <button
              onClick={() => { setIsForgot(!isForgot); setMessage(""); }}
              className="text-sm text-gray-600 hover:underline block w-full"
            >
              {isForgot ? "← Back to Login" : "Forgot Password?"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}