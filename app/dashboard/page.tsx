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

type PossItem = {
  gameId: string;
  possession: "HOME" | "AWAY" | null;
};

type FairLineItem = {
  gameId: string;
  home: string;
  away: string;
  fair: { spread_home: number; total: number };
  prob: { home_win: number; away_win: number };
  dist: { total_mean: number; total_std: number; margin_mean: number; margin_std: number };
};

export default function Dashboard() {
  const [me, setMe] = useState<UserPublic | null>(null);
  const [games, setGames] = useState<ScoreboardGame[]>([]);
  const [proj, setProj] = useState<Record<string, ProjItem>>({});
  const [poss, setPoss] = useState<Record<string, PossItem>>({});
  const [fair, setFair] = useState<Record<string, FairLineItem>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshMs = 30_000;

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
      // Scoreboard
      const sbRes = await apiGet("/v1/nba/scoreboard/today");
      if (sbRes.ok) {
        const sb = await sbRes.json();
        setGames(sb.games || []);
      } else {
        setGames([]);
      }

      // Fair lines (new)
      const fRes = await apiGet("/v1/nba/fairline/today");
      if (fRes.ok) {
        const fd = await fRes.json();
        const map: Record<string, FairLineItem> = {};
        for (const it of fd.items || []) map[it.gameId] = it;
        setFair(map);
      } else {
        setFair({});
      }

      // Projections (existing placeholder)
      const pRes = await apiGet("/v1/nba/projections/today");
      if (pRes.ok) {
        const p = await pRes.json();
        const map: Record<string, ProjItem> = {};
        for (const it of p.items || []) map[it.gameId] = it;
        setProj(map);
      } else {
        setProj({});
      }

      // Possession (only for live games)
      const possRes = await apiGet("/v1/nba/possession/today");
      if (possRes.ok) {
        const pd = await possRes.json();
        const map: Record<string, PossItem> = {};
        for (const it of pd.items || []) map[it.gameId] = { gameId: it.gameId, possession: it.possession || null };
        setPoss(map);
      } else {
        setPoss({});
      }
    } finally {
      setLoading(false);
    }
  }

  function logoUrl(tricode: string) {
    const code = tricode.toLowerCase();
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${code}.png&w=80&h=80&transparent=true`;
  }

  function formatUtc(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function pct(x: number) {
    return `${Math.round(x * 100)}%`;
  }

  function fmtLine(x: number) {
    // one decimal is enough
    const v = Math.round(x * 10) / 10;
    // show + for positive numbers
    return v > 0 ? `+${v}` : `${v}`;
  }

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => (a.gameTimeUTC < b.gameTimeUTC ? -1 : 1));
  }, [games]);

  useEffect(() => {
    (async () => {
      const ok = await loadMe();
      if (ok) await loadData();
    })();

    const id = setInterval(loadData, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Dot = () => <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />;

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
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-600">Logged in as</div>
                <div className="text-lg font-medium">{me.email}</div>
                <div className="mt-2 text-sm">
                  Plan: <span className="font-semibold">{me.plan}</span>
                </div>
              </div>

              <button
                onClick={loadData}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold">Today’s Games</h2>
              <p className="text-xs text-gray-500 mt-1">Auto-refreshing every 30 seconds</p>

              <div className="mt-4 space-y-3">
                {sortedGames.length === 0 ? (
                  <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                    No games found (or scoreboard not available yet).
                  </div>
                ) : (
                  sortedGames.map((g) => {
                    const p = proj[g.gameId];
                    const pos = poss[g.gameId]?.possession || null;
                    const f = fair[g.gameId];

                    return (
                      <div key={g.gameId} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={logoUrl(g.away.teamTricode)} alt={g.away.teamTricode} className="h-8 w-8" />
                            <div className="text-sm">
                              <div className="font-medium flex items-center gap-2">
                                <span className="inline-flex items-center gap-2">
                                  <span>{g.away.teamTricode}</span>
                                  {pos === "AWAY" ? <Dot /> : null}
                                </span>
                                <span className="text-gray-400">@</span>
                                <span className="inline-flex items-center gap-2">
                                  <span>{g.home.teamTricode}</span>
                                  {pos === "HOME" ? <Dot /> : null}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {g.gameStatusText} • {formatUtc(g.gameTimeUTC)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-sm font-mono">
                              {g.away.score} - {g.home.score}
                            </div>
                            <img src={logoUrl(g.home.teamTricode)} alt={g.home.teamTricode} className="h-8 w-8" />
                          </div>
                        </div>

                        {/* Fair line display */}
                        {f ? (
                          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                            <div className="rounded-lg bg-gray-50 border p-3">
                              <div className="text-xs text-gray-500">Fair Total</div>
                              <div className="font-semibold">{Math.round(f.fair.total * 10) / 10}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 border p-3">
                              <div className="text-xs text-gray-500">Fair Spread (Home)</div>
                              <div className="font-semibold">{fmtLine(f.fair.spread_home)}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 border p-3">
                              <div className="text-xs text-gray-500">Home Win%</div>
                              <div className="font-semibold">{pct(f.prob.home_win)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-gray-500">Fair lines loading…</div>
                        )}

                        {/* Existing win% cards (placeholder) */}
                        {p ? (
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-gray-50 border p-3">
                              <div className="text-xs text-gray-500">{g.away.teamTricode} win%</div>
                              <div className="font-semibold">{pct(p.awayWinProb)}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 border p-3">
                              <div className="text-xs text-gray-500">{g.home.teamTricode} win%</div>
                              <div className="font-semibold">{pct(p.homeWinProb)}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
