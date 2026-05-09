import Link from "next/link";
import type { ReactNode } from "react";
import { Folder } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  eyebrow,
  showMarketingNav = false,
  subtitle,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  showMarketingNav?: boolean;
  subtitle: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-devstash-bg text-foreground">
      {showMarketingNav ? (
        <header className="fixed left-0 top-0 z-30 w-full border-b border-transparent bg-[#080d18]/45 backdrop-blur">
          <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link className="inline-flex items-center gap-2.5 font-semibold text-zinc-100" href="/">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white">
                <Folder aria-hidden="true" className="size-4" />
              </span>
              <span className="text-base">DevStash</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex">
              <Link className="transition hover:text-zinc-100" href="/#features">
                Features
              </Link>
              <Link className="transition hover:text-zinc-100" href="/#pricing">
                Pricing
              </Link>
            </nav>

            <div className="inline-flex items-center gap-2">
              <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-zinc-200")} href="/sign-in">
                Sign In
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90",
                )}
                href="/register"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>
      ) : null}

      <div
        className={cn(
          "mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1fr] lg:px-8",
          showMarketingNav && "pt-28",
        )}
      >
        <section className="space-y-8">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white">
              <Folder aria-hidden="true" className="size-5" />
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
