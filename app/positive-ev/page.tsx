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
    const id = setInterval(load, 15_000); // Positive EV should feel live
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, minEv, maxResults]);

  const filtered = useMemo(() => {
    const q = bookFilter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.book || "").toLowerCase().includes(q));
  }, [rows, bookFilter]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Positive EV</h1>
          <a href="/dashboard" className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50">
            Back to Dashboard
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Auto-refresh: 15s • {fetchedAt ? `Odds fetched: ${new Date(fetchedAt).toLocaleString()}` : "—"}
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          {/* Filters */}
          <aside className="rounded-2xl bg-white shadow p-4">
            <div className="font-semibold mb-3">Filters</div>

            <label className="block text-sm mb-2">
              Market
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as any)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              >
                <option value="spreads">Spreads</option>
                <option value="totals">Totals</option>
              </select>
            </label>

            <label className="block text-sm mb-2">
              Minimum EV ({evPct(minEv)})
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

            <label className="block text-sm mb-2">
              Max results
              <input
                type="number"
                min={10}
                max={200}
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value || "50", 10))}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>

            <label className="block text-sm mb-2">
              Book search
              <input
                value={bookFilter}
                onChange={(e) => setBookFilter(e.target.value)}
                placeholder="e.g. FanDuel"
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>

            <button
              onClick={load}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-black text-white py-2.5 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh now"}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              Next: book checkboxes, saved filters, and fair-vs-book explanation panel.
            </p>
          </aside>

          {/* Table */}
          <section className="rounded-2xl bg-white shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Opportunities</div>
              <div className="text-xs text-gray-500">{filtered.length} rows</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left border-b">
                    <th className="p-3">Game</th>
                    <th className="p-3">Pick</th>
                    <th className="p-3">Book</th>
                    <th className="p-3">Odds</th>
                    <th className="p-3">Book Line</th>
                    <th className="p-3">Fair Line</th>
                    <th className="p-3">Model P</th>
                    <th className="p-3">Implied P</th>
                    <th className="p-3">EV</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r.gameId}-${r.book}-${r.pick}-${r.book_line}-${r.odds_decimal}`} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{r.away} @ {r.home}</div>
                        <div className="text-xs text-gray-500">{r.gameStatusText || ""}</div>
                      </td>
                      <td className="p-3 font-medium">{r.pick}</td>
                      <td className="p-3">
                        <div>{r.book}</div>
                        <div className="text-xs text-gray-500">{r.source}</div>
                      </td>
                      <td className="p-3">{fmt(r.odds_decimal)}</td>
                      <td className="p-3">{fmt(r.book_line)}</td>
                      <td className="p-3">{fmt(r.fair_line)}</td>
                      <td className="p-3">{pct(r.model_prob)}</td>
                      <td className="p-3">{pct(r.implied_prob)}</td>
                      <td className="p-3 font-semibold">{evPct(r.ev)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td className="p-6 text-sm text-gray-600" colSpan={9}>
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
    </main>
  );
}
