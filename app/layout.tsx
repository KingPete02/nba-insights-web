import "./globals.css";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "NBA Insights",
  description: "Positive EV and live NBA edges",
};

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60 hover:text-white transition"
    >
      {label}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} min-h-screen bg-background text-zinc-100 antialiased`}>
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-border bg-surface/60 backdrop-blur md:min-h-screen">
            <div className="p-4">
              <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="text-sm text-zinc-400">NBA</div>
                <div className="text-lg font-semibold tracking-tight">
                  Insights <span className="text-emerald-400">EV</span>
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Live edges • clean signals
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <NavItem href="/dashboard" label="Dashboard" />
                <NavItem href="/positive-ev" label="Positive EV" />
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="text-xs text-zinc-400">Pro Tip</div>
                <div className="mt-1 text-sm text-zinc-200">
                  Look for <span className="text-emerald-400 font-medium">consistent EV</span>, not spikes.
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur">
              <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  Precision-first • <span className="text-emerald-400">profit-driven</span>
                </div>
                <a
                  href="https://nba-insights-api.onrender.com/docs"
                  className="text-xs rounded-xl border border-border bg-surface px-3 py-2 hover:bg-zinc-800/60 transition"
                  target="_blank"
                  rel="noreferrer"
                >
                  API Docs
                </a>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
