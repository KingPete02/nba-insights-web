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

export default function Dashboard() {
  const [me, setMe] = useState<UserPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiGet("/v1/auth/me");
    if (!res.ok) {
      setError("Not logged in or session expired. Go back and log in again.");
      setMe(null);
      clearToken();
      return;
    }
    setError(null);
    setMe(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
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

            <div className="mt-6 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
              Next: we’ll show NBA insights here and make some features PRO-only.
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
