import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  children,
  eyebrow,
  subtitle,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-devstash-bg text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <section className="space-y-8">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="flex size-11 items-center justify-center rounded-xl bg-violet-500 text-sm font-semibold text-white">
              DS
            </span>
            <span className="text-xl font-semibold text-white">DevStash</span>
          </Link>

          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              {title}
            </h1>
            <p className="text-base leading-7 text-zinc-400">{subtitle}</p>
          </div>
        </section>

        <section className="rounded-lg border border-devstash-line bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
