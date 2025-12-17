import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800/80 bg-zinc-950/40 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-zinc-800/60 flex items-start justify-between gap-4">
      <div>
        <div className="text-base font-semibold tracking-tight text-zinc-100">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-zinc-400">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-5">{children}</div>;
}

export function Button({
  children,
  variant = "ghost",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  const base =
    "rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const ghost = "border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900/50 text-zinc-200";
  const primary =
    "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 shadow-glow";
  return (
    <button className={`${base} ${variant === "primary" ? primary : ghost} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" }) {
  const cls =
    tone === "green"
      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/25"
      : "bg-zinc-900/40 text-zinc-200 border-zinc-800/80";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${cls}`}>{children}</span>;
}
