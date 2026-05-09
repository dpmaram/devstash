"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

type CheckoutApiResponse = {
  success: boolean;
  error?: string;
  url?: string;
};

const FREE_FEATURES = [
  "Up to 50 items",
  "Up to 3 collections",
  "Core search and organization",
];

const PRO_FEATURES = [
  "Unlimited items and collections",
  "AI features and smart tagging",
  "Priority support",
  "Advanced customization",
  "Team collaboration",
];

export function UpgradePage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const price = useMemo(
    () =>
      cycle === "monthly"
        ? { value: "$8", suffix: "/mo" }
        : { value: "$72", suffix: "/yr", savings: "Save 25%" },
    [cycle],
  );

  async function handleUpgrade() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingCycle: cycle === "yearly" ? "annual" : "monthly",
        }),
      });
      const body = (await response.json()) as CheckoutApiResponse;

      if (response.status === 401) {
        window.location.assign("/sign-in?callbackUrl=%2Fupgrade");
        return;
      }

      if (!response.ok || !body.success || !body.url) {
        setError(body.error ?? "Unable to start checkout.");
        setIsSubmitting(false);
        return;
      }

      window.location.assign(body.url);
    } catch {
      setError("Unable to start checkout.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-devstash-bg text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="flex items-center gap-2 border-b border-devstash-line py-6">
          <Link
            href="/items/snippets"
            className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-cyan-300">
            Upgrade Your Plan
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Unlock Pro Features
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Get unlimited storage, AI features, and priority support to build your knowledge hub at scale.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center py-8">
          <div
            aria-label="Billing period"
            className="inline-flex rounded-full border border-white/15 bg-white/5 p-1"
            role="group"
          >
            <button
              className={cn(
                "rounded-full px-6 py-2 text-sm font-semibold transition",
                cycle === "monthly"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
              onClick={() => setCycle("monthly")}
              type="button"
            >
              Monthly
            </button>
            <button
              className={cn(
                "rounded-full px-6 py-2 text-sm font-semibold transition",
                cycle === "yearly"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
              onClick={() => setCycle("yearly")}
              type="button"
            >
              Yearly
              {cycle === "yearly" && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-300">
                  {price.savings}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-2 py-8">
          {/* Free tier */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-8">
            <h3 className="text-2xl font-semibold">Free</h3>
            <div className="mt-6">
              <p className="inline-flex items-end gap-1.5 text-zinc-400">
                <span className="text-3xl font-semibold text-white">$0</span>
                <span className="text-sm">/mo</span>
              </p>
            </div>
            <p className="mt-2 text-sm text-zinc-400">Perfect for getting started</p>
            <Button
              className="mt-6 w-full"
              disabled
              variant="outline"
            >
              Current Plan
            </Button>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                  <Check aria-hidden="true" className="size-4 mt-0.5 shrink-0 text-green-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-2xl border border-blue-400/45 bg-[#10172a] p-8 shadow-[0_25px_60px_rgba(59,130,246,0.2)]">
            <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-3 py-1 font-mono text-[11px] font-semibold text-white">
              Most Popular
            </span>
            <h3 className="text-2xl font-semibold">Pro</h3>
            <div className="mt-6">
              <p className="inline-flex items-end gap-1.5 text-zinc-400">
                <span className="text-4xl font-semibold text-white">{price.value}</span>
                <span className="text-sm">{price.suffix}</span>
              </p>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              {cycle === "yearly"
                ? "Billed $72 annually"
                : "Billed monthly"}
            </p>
            <Button
              className="mt-6 w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90"
              disabled={isSubmitting}
              onClick={handleUpgrade}
              type="button"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
              ) : null}
              Upgrade to Pro
            </Button>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check aria-hidden="true" className="size-4 mt-0.5 shrink-0 text-blue-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA section */}
        <div className="py-12 text-center">
          <p className="text-zinc-400">
            Questions?{" "}
            <Link href="/settings" className="text-blue-400 hover:text-blue-300">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
