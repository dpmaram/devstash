import Link from "next/link";
import { Folder } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ChaosAnimation } from "./ChaosAnimation";
import { NavScrollState } from "./NavScrollState";
import { PricingToggle } from "./PricingToggle";
import { Reveal } from "./Reveal";

type AccentType =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "file"
  | "image"
  | "url";

const accentColor: Record<AccentType, string> = {
  snippet: "#3b82f6",
  prompt: "#f59e0b",
  command: "#06b6d4",
  note: "#22c55e",
  file: "#64748b",
  image: "#ec4899",
  url: "#6366f1",
};

const chaosIcons = ["N", "GH", "SL", "VS", "TAB", ">_", "TXT", "BM"] as const;

const featureCards: ReadonlyArray<{ title: string; text: string; accent: AccentType }> = [
  {
    title: "Code Snippets",
    text: "Save and tag reusable snippets with syntax-friendly formatting.",
    accent: "snippet",
  },
  {
    title: "AI Prompts",
    text: "Version your best prompts and keep results tied to context.",
    accent: "prompt",
  },
  {
    title: "Instant Search",
    text: "Find anything in seconds with keyboard-first global search.",
    accent: "command",
  },
  {
    title: "Commands",
    text: "Store battle-tested terminal commands with explanations.",
    accent: "command",
  },
  {
    title: "Files and Docs",
    text: "Keep docs, cheat sheets, and assets linked to your workflow.",
    accent: "file",
  },
  {
    title: "Collections",
    text: "Organize related knowledge into focused project collections.",
    accent: "note",
  },
];

const dashboardPreview: ReadonlyArray<{ label: string; accent: AccentType }> = [
  { label: "Snippet", accent: "snippet" },
  { label: "Prompt", accent: "prompt" },
  { label: "Command", accent: "command" },
  { label: "Note", accent: "note" },
  { label: "Image", accent: "image" },
  { label: "Link", accent: "url" },
];

const footerGroups: ReadonlyArray<{ title: string; links: ReadonlyArray<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#", label: "Docs" },
      { href: "#", label: "Changelog" },
    ],
  },
];

export function Homepage() {
  return (
    <main className="min-h-screen bg-[#080d18] text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_90%_5%,rgba(236,72,153,0.18),transparent_32%),radial-gradient(circle_at_40%_75%,rgba(6,182,212,0.14),transparent_35%)]"
      />

      <header
        className="fixed left-0 top-0 z-30 w-full border-b border-transparent bg-[#080d18]/45 transition-all"
        id="marketing-nav"
      >
        <NavScrollState targetId="marketing-nav" />
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

      <section className="pt-36">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-4xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-cyan-300">Developer Knowledge Hub</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Stop Losing Your
              <span className="bg-gradient-to-r from-[#b8d4ff] via-[#8ff0ff] to-[#ffd18f] bg-clip-text text-transparent">
                {" "}
                Developer Knowledge
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base text-zinc-400 sm:text-lg">
              Your snippets, prompts, terminal commands, files, and ideas are scattered across tools. DevStash turns that
              chaos into one searchable system.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90",
                )}
                href="/register"
              >
                Start for Free
              </Link>
              <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/15 text-zinc-100")} href="/#features">
                Watch Demo
              </Link>
            </div>
          </Reveal>

          <Reveal className="mt-14 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)]">
            <article className="rounded-3xl border border-white/15 bg-white/5 p-5">
              <p className="mb-4 text-sm text-zinc-400">Your knowledge today...</p>
              <ChaosAnimation icons={chaosIcons} />
            </article>

            <div aria-hidden="true" className="mx-auto flex w-24 animate-pulse justify-center text-sky-300 md:w-full md:rotate-0 rotate-90">
              <svg className="w-full" viewBox="0 0 160 70">
                <path
                  d="M10 35 H130 M130 35 L105 10 M130 35 L105 60"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="8"
                />
              </svg>
            </div>

            <article className="rounded-3xl border border-white/15 bg-white/5 p-5">
              <p className="mb-4 text-sm text-zinc-400">...with DevStash</p>
              <div className="grid min-h-64 grid-cols-[104px_1fr] overflow-hidden rounded-2xl border border-white/15">
                <aside className="border-r border-white/10 bg-white/5 p-3">
                  <p className="mt-2 text-[11px] text-zinc-300">Dashboard</p>
                  <p className="mt-2 text-[11px] text-zinc-500">Snippets</p>
                  <p className="mt-2 text-[11px] text-zinc-500">Prompts</p>
                  <p className="mt-2 text-[11px] text-zinc-500">Commands</p>
                  <p className="mt-2 text-[11px] text-zinc-500">Collections</p>
                </aside>
                <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3">
                  {dashboardPreview.map((item) => (
                    <div className="relative rounded-xl border border-white/10 bg-white/5 p-2" key={item.label}>
                      <span
                        className="absolute inset-x-[-1px] top-[-1px] h-1 rounded-t-xl"
                        style={{ backgroundColor: accentColor[item.accent] }}
                      />
                      <span className="font-mono text-[11px] text-zinc-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="pt-24" id="features">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-cyan-300">Core Features</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Everything You Capture, Finally in One Place</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => (
              <Reveal className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#10172a] p-6" key={feature.title}>
                <span
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: accentColor[feature.accent] }}
                />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-24">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal className="rounded-3xl border border-white/15 bg-[#10172a] p-7">
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-900">Pro Feature</Badge>
            <h2 className="mt-4 text-3xl font-semibold">AI Assistance Built Into Your Workflow</h2>
            <ul className="mt-6 list-disc space-y-2 pl-5 text-zinc-400">
              <li>Generate smart tags from content</li>
              <li>Summarize long notes instantly</li>
              <li>Suggest related items across your stash</li>
              <li>Draft quick command explanations</li>
            </ul>
          </Reveal>

          <Reveal className="rounded-3xl border border-white/15 bg-[#10172a] p-7">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-300" />
              <span className="size-2 rounded-full bg-amber-300" />
              <span className="size-2 rounded-full bg-emerald-300" />
              <p className="ml-2 font-mono text-xs text-zinc-400">snippet.ts</p>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0b1220] p-4 text-sm leading-6 text-sky-200">
              <code>{`const optimizeBuild = () => {
  const cache = loadCache();
  return runPipeline({ cache, parallel: true });
};`}</code>
            </pre>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs text-zinc-400">AI Generated Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 font-mono text-xs text-emerald-200">
                  #build
                </span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 font-mono text-xs text-emerald-200">
                  #performance
                </span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 font-mono text-xs text-emerald-200">
                  #typescript
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pt-24" id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-cyan-300">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Simple Pricing for Serious Developers</h2>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal className="rounded-3xl border border-white/15 bg-[#10172a] p-7">
              <h3 className="text-2xl font-semibold">Free</h3>
              <p className="mt-4 inline-flex items-end gap-1.5 text-zinc-400">
                <span className="text-4xl font-semibold text-white">$0</span>
                <span className="text-sm">/mo</span>
              </p>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-zinc-400">
                <li>Up to 50 items</li>
                <li>Up to 3 collections</li>
                <li>Core search and organization</li>
              </ul>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-6 border-white/15 text-zinc-100",
                )}
                href="/register"
              >
                Get Started
              </Link>
            </Reveal>

            <Reveal className="relative rounded-3xl border border-blue-400/45 bg-[#10172a] p-7 shadow-[0_25px_60px_rgba(59,130,246,0.2)]">
              <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-3 py-1 font-mono text-[11px] font-semibold text-white">
                Most Popular
              </span>
              <h3 className="text-2xl font-semibold">Pro</h3>
              <div className="mt-4">
                <PricingToggle />
              </div>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-zinc-400">
                <li>Unlimited items and collections</li>
                <li>AI features and smart tagging</li>
                <li>Priority support</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="rounded-3xl border border-white/20 bg-gradient-to-br from-[#6366f1]/30 to-[#06b6d4]/20 p-10 text-center">
            <h2 className="text-3xl font-semibold sm:text-4xl">Ready to Organize Your Knowledge?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-zinc-200/90">
              Stop context switching between tools and build your developer memory system.
            </p>
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90",
              )}
              href="/register"
            >
              Start Building Your Stash
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/15 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
          <div>
            <Link className="inline-flex items-center gap-2.5 font-semibold text-zinc-100" href="/">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#6366f1] text-white">
                <Folder aria-hidden="true" className="size-4" />
              </span>
              <span className="text-base">DevStash</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-400">The developer knowledge hub for teams and solo builders.</p>
            <p className="mt-5 text-xs text-zinc-500">(c) {new Date().getFullYear()} DevStash. All rights reserved.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-zinc-100">{group.title}</p>
                <div className="mt-3 space-y-2 text-sm text-zinc-400">
                  {group.links.map((link) => (
                    <Link className="block transition hover:text-zinc-100" href={link.href} key={link.label}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
