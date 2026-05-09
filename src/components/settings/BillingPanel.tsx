"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPanelProps = {
  isPro: boolean;
  planTier: "FREE" | "PRO";
};

type BillingCycle = "monthly" | "annual";

type BillingApiResponse = {
  success: boolean;
  error?: string;
  url?: string;
};

export function BillingPanel({ isPro, planTier }: BillingPanelProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [isSubmittingPortal, setIsSubmittingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planLabel = useMemo(() => (isPro ? "Pro" : "Free"), [isPro]);

  async function handleUpgrade() {
    setError(null);
    setIsSubmittingCheckout(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingCycle,
        }),
      });
      const body = (await response.json()) as BillingApiResponse;

      if (!response.ok || !body.success || !body.url) {
        setError(body.error ?? "Unable to start checkout.");
        setIsSubmittingCheckout(false);
        return;
      }

      window.location.assign(body.url);
    } catch {
      setError("Unable to start checkout.");
      setIsSubmittingCheckout(false);
    }
  }

  async function handleManageBilling() {
    setError(null);
    setIsSubmittingPortal(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const body = (await response.json()) as BillingApiResponse;

      if (!response.ok || !body.success || !body.url) {
        setError(body.error ?? "Unable to open billing portal.");
        setIsSubmittingPortal(false);
        return;
      }

      window.location.assign(body.url);
    } catch {
      setError("Unable to open billing portal.");
      setIsSubmittingPortal(false);
    }
  }

  return (
    <article className="space-y-4 rounded-lg border border-devstash-line bg-white/[0.035] p-5">
      <div>
        <h2 className="text-2xl font-semibold text-white">Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your DevStash subscription and Stripe billing details.
        </p>
      </div>

      <div className="rounded-lg border border-devstash-line bg-white/[0.03] p-4">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <p className="mt-1 text-lg font-semibold text-white">{planLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan tier: {planTier}
        </p>
      </div>

      {!isPro ? (
        <div className="space-y-3">
          <div
            aria-label="Billing period"
            className="inline-flex rounded-full border border-white/15 bg-white/5 p-1"
            role="group"
          >
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                billingCycle === "monthly"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
              onClick={() => setBillingCycle("monthly")}
              type="button"
            >
              Monthly ($8/mo)
            </button>
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                billingCycle === "annual"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
              onClick={() => setBillingCycle("annual")}
              type="button"
            >
              Annual ($72/yr)
            </button>
          </div>

          <Button
            className="h-10 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90"
            disabled={isSubmittingCheckout}
            onClick={handleUpgrade}
            type="button"
          >
            {isSubmittingCheckout ? (
              <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
            ) : null}
            Upgrade to Pro
          </Button>
        </div>
      ) : (
        <Button
          className="h-10 border-devstash-line bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
          disabled={isSubmittingPortal}
          onClick={handleManageBilling}
          type="button"
          variant="outline"
        >
          {isSubmittingPortal ? (
            <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
          ) : null}
          Manage Billing
        </Button>
      )}

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </article>
  );
}
