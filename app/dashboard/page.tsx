"use client";

import { useEffect, useMemo, useState } from "react";
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

type ProjItem = {
  gameId: string;
  homeWinProb: number;
  awayWinProb: number;
};

export default function Dashboard() {
  const [me, setMe] = useState<UserPublic | null>(null);
  const [games, setGames] = useState<ScoreboardGame[]>([]);
  const [proj, setProj] = useState<Record<string, ProjItem>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function loadData() {
    setLoading(true);
    try {
      const sbRes = await apiGet("/v1/nba/scoreboard/today");
      const sb = sbRes.ok ? await sbRes.json() : { games: [] };
      setGames(sb.games || []);

      const pRes = await apiGet("/v1/nba/projections/today");
      if (pRes.ok) {
        const p = await pRes.json();
        const map: Record<string, ProjItem> = {};
        for (const it of p.items || []) map[it.gameId] = it;
        setProj(map);
      } else {
        setProj({});
      }
    } finally {
      setLoading(false);
    }
  }

  function logoUrl(tricode: string) {
    const code = tricode.toLowerCase();
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${code}.png&w=80&h=80&transparent=true`;
  }

  function pct(x: number) {
    return `${Math.round(x * 100)}%`;
  }

  useEffect(() => {
    (async () => {
      const ok = await loadMe();
      if (ok) await loadData();
    })();

    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {me && (
          <div className="rounded-2xl bg-white shadow p-6">
            <div className="mb-6">
              <div className="text-sm text-gray-600">Logged in as</div>
              <div className="text-lg font-medium">{me.email}</div>
              <div className="text-sm mt-1">
                Plan: <span className="font-semibold">{me.plan}</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-2">Today’s Games</h2>

            {games.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                No games found.
              </div>
            ) : (
              games.map((g) => {
                const p = proj[g.gameId];
                return (
                  <div key={g.gameId} className="rounded-xl border p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={logoUrl(g.away.teamTricode)} className="h-8 w-8" />
                        <span className="font-medium">
                          {g.away.teamTricode} @ {g.home.teamTricode}
                        </span>
                        <img src={logoUrl(g.home.teamTricode)} className="h-8 w-8" />
                      </div>
                      <div className="font-mono">
                        {g.away.score} - {g.home.score}
                      </div>
                    </div>

                    {p && (
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="rounded-lg border p-2">
                          {g.away.teamTricode} win%: <b>{pct(p.awayWinProb)}</b>
                        </div>
                        <div className="rounded-lg border p-2">
                          {g.home.teamTricode} win%: <b>{pct(p.homeWinProb)}</b>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
