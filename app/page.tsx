"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPostForm, apiPostJson, clearToken, setToken, API_BASE } from "../lib/api";

type UserPublic = {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [me, setMe] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMe() {
    setError(null);
    const res = await apiGet("/v1/auth/me");
    if (!res.ok) {
      setMe(null);
      return;
    }
    setMe(await res.json());
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signup() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPostJson("/v1/auth/signup", { email, password });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.detail || "Signup failed");
        return;
      }
      await login(true);
    } finally {
      setLoading(false);
    }
  }

  async function login(internal = false) {
    if (!internal) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await apiPostForm("/v1/auth/login", { username: email, password });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.access_token) {
        setError(body?.detail || "Login failed");
        return;
      }
      setToken(body.access_token);
      await loadMe();
    } finally {
      if (!internal) setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setMe(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">NBA Insights</h1>
          {me ? (
            <button onClick={logout} className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50">
              Log out
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          API: <span className="font-mono">{API_BASE}</span>
        </p>

        {me ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-sm text-gray-600">Logged in as</div>
              <div className="font-medium">{me.email}</div>
              <div className="mt-2 text-sm">
                Plan: <span className="font-semibold">{me.plan}</span>
              </div>
            </div>

            <a href="/dashboard" className="block text-center rounded-xl bg-black text-white py-2.5 hover:opacity-90">
              Go to Dashboard
            </a>

            <button onClick={loadMe} className="w-full rounded-xl border py-2.5 hover:bg-gray-50">
              Refresh
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-xl py-2 text-sm border ${mode === "login" ? "bg-black text-white" : ""}`}
              >
                Log in
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-xl py-2 text-sm border ${mode === "signup" ? "bg-black text-white" : ""}`}
              >
                Sign up
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="text-sm text-gray-700 mb-1">Email</div>
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700 mb-1">Password</div>
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="********"
                />
              </label>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading || !email || !password}
                onClick={mode === "signup" ? signup : () => login(false)}
                className="w-full rounded-xl bg-black text-white py-2.5 disabled:opacity-50"
              >
                {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
