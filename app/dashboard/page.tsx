"use client";

import { useEffect, useState } from "react";
import { apiGet, clearToken } from "../../lib/api";

type UserPublic = {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

type ScoreboardGame = {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameTimeUTC: string;
  home: { teamTricode: string; score: number };
  away: { teamTricode: string; score: number };
};

export default function Dashboard() {
  const [me, setMe] = useState<UserPublic | null>(null);
  const [games, setGames] = useState<ScoreboardGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);

  async function loadMe() {
    const res = await apiGet("/v1/auth/me");
    if (!res.ok) {
      setError("Not logged in or session expired. Go back and log in again.");
      setMe(null);
      clearToken();
      return false;
    }
    setError(null);
    setMe(await res.json());
    return true;
  }

  async function loadScoreboard() {
    setLoadingGames(true);
    try {
      const res = await apiGet("/v1/nba/scoreboard/today");
      if (!res.ok) {
        setGames([]);
        return;
      }
      const data = await res.json();
      setGames(data.games || []);
    } finally {
      setLoadingGames(false);
    }
  }

  function formatUtc(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await loadMe();
      if (ok) await loadScoreboard();
    })();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <a href="/" className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50">
            Back
          </a>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        {me ? (
          <div className="mt-6 rounded-2xl bg-white shadow p-6">
            <div className="text-sm text-gray-600">Logged in as</div>
            <div className="text-lg font-medium">{me.email}</div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <div className="text-xs text-gray-500">Plan</div>
                <div className="font-semibold">{me.plan}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-gray-500">Stripe Customer</div>
                <div className="font-mono text-sm">{me.stripe_customer_id ?? "—"}</div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today’s NBA Games</h2>
              <button
                onClick={loadScoreboard}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
                disabled={loadingGames}
              >
                {loadingGames ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {games.length === 0 ? (
                <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                  No games found (or scoreboard not available yet).
                </div>
              ) : (
                games.map((g) => (
                  <div key={g.gameId} className="rounded-xl border p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">
                        {g.away.teamTricode} @ {g.home.teamTricode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {g.gameStatusText} • {formatUtc(g.gameTimeUTC)}
                      </div>
                    </div>
                    <div className="text-sm font-mono">
                      {g.away.score} - {g.home.score}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
