"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

type EdgeRow = {
  gameId: string;
  home: string;
  away: string;
  gameTimeUTC: string | null;
  gameStatus: number | null;
  gameStatusText: string | null;

  book: string;
  source: string;
  market: "spreads" | "totals";
  pick: string;

  book_line: number;
  fair_line: number;
  odds_decimal: number;

  implied_prob: number;
  model_prob: number;
  ev: number;

  fetched_at: string | null;
};

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}
function evPct(ev: number) {
  return `${Math.round(ev * 1000) / 10}%`;
}
function fmt(x: number) {
  const v = Math.round(x * 100) / 100;
  return `${v}`;
}

function evClass(ev: number) {
  // green for strong EV, neutral for low
  if (ev >= 0.06) return "text-emerald-400";
  if (ev >= 0.03) return "text-emerald-300";
  return "text-zinc-200";
}

export default function PositiveEVPage() {
  const [market, setMarket] = useState<"spreads" | "totals">("spreads");
  const [minEv, setMinEv] = useState(0.02);
  const [maxResults, setMaxResults] = useState(50);
  const [bookFilter, setBookFilter] = useState("");
  const [rows, setRows] = useState<EdgeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const url = `/v1/nba/edges/today?market=${market}&min_ev=${minEv}&max_results=${maxResults}`;
      const res = await apiGet(url);
      if (!res.ok) {
        setRows([]);
        return;
      }
      const data = await res.json();
      const items: EdgeRow[] = data.items || [];
      setRows(items);
      setFetchedAt(items[0]?.fetched_at || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, minEv, maxResults]);

  const filtered = useMemo(() => {
    const q = bookFilter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.book || "").toLowerCase().includes(q));
  }, [rows, bookFilter]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Positive EV</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live opportunities ranked by expected value.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Auto-refresh: 15s • {fetchedAt ? `Odds fetched: ${new Date(fetchedAt).toLocaleString()}` : "—"}
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm hover:bg-zinc-800/60 disabled:opacity-50 transition"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Filters */}
        <aside className="rounded-2xl border border-border bg-surface/60 p-4 shadow-glow">
          <div className="font-semibold text-zinc-100">Filters</div>

          <div className="mt-4 space-y-3">
            <label className="block text-sm text-zinc-300">
              Market
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-zinc-100"
              >
                <option value="spreads">Spreads</option>
                <option value="totals">Totals</option>
              </select>
            </label>

            <label className="block text-sm text-zinc-300">
              Minimum EV <span className="text-emerald-400 font-medium">({evPct(minEv)})</span>
              <input
                type="range"
                min={0}
                max={0.15}
                step={0.005}
                value={minEv}
                onChange={(e) => setMinEv(parseFloat(e.target.value))}
                className="mt-2 w-full"
              />
            </label>

            <label className="block text-sm text-zinc-300">
              Max results
              <input
                type="number"
                min={10}
                max={200}
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value || "50", 10))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-zinc-100"
              />
            </label>

            <label className="block text-sm text-zinc-300">
              Book search
              <input
                value={bookFilter}
                onChange={(e) => setBookFilter(e.target.value)}
                placeholder="FanDuel, DK, etc."
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-zinc-100"
              />
            </label>

            <div className="pt-2 text-xs text-zinc-500">
              Next: book checkboxes + saved presets + row details drawer.
            </div>
          </div>
        </aside>

        {/* Table */}
        <section className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="font-semibold">Opportunities</div>
            <div className="text-xs text-zinc-500">{filtered.length} rows</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-950/70 backdrop-blur border-b border-border">
                <tr className="text-left text-xs text-zinc-400">
                  <th className="p-3">Game</th>
                  <th className="p-3">Pick</th>
                  <th className="p-3">Book</th>
                  <th className="p-3">Odds</th>
                  <th className="p-3">Book</th>
                  <th className="p-3">Fair</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Implied</th>
                  <th className="p-3">EV</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={`${r.gameId}-${r.book}-${r.pick}-${r.book_line}-${r.odds_decimal}-${i}`}
                    className={`border-b border-border/60 hover:bg-zinc-900/40 transition ${
                      i % 2 === 0 ? "bg-transparent" : "bg-zinc-950/20"
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-medium text-zinc-100">{r.away} @ {r.home}</div>
                      <div className="text-xs text-zinc-500">{r.gameStatusText || ""}</div>
                    </td>

                    <td className="p-3 font-medium text-zinc-100">{r.pick}</td>

                    <td className="p-3">
                      <div className="text-zinc-100">{r.book}</div>
                      <div className="text-xs text-zinc-500">{r.source}</div>
                    </td>

                    <td className="p-3 mono text-zinc-200">{fmt(r.odds_decimal)}</td>
                    <td className="p-3 mono text-zinc-200">{fmt(r.book_line)}</td>
                    <td className="p-3 mono text-zinc-200">{fmt(r.fair_line)}</td>
                    <td className="p-3 mono text-zinc-200">{pct(r.model_prob)}</td>
                    <td className="p-3 mono text-zinc-200">{pct(r.implied_prob)}</td>

                    <td className={`p-3 mono font-semibold ${evClass(r.ev)}`}>
                      {evPct(r.ev)}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-sm text-zinc-400" colSpan={9}>
                      No opportunities found for current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
