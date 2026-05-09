"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

type CheckoutApiResponse = {
  success: boolean;
  error?: string;
  url?: string;
};

export function PricingToggle() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const price = useMemo(
    () =>
      cycle === "monthly"
        ? { value: "$8", suffix: "/mo" }
        : { value: "$72", suffix: "/yr" },
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
        window.location.assign("/sign-in?callbackUrl=%2F%23pricing");
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
    <div className="space-y-4">
      <div
        aria-label="Billing period"
        className="inline-flex rounded-full border border-white/15 bg-white/5 p-1"
        role="group"
      >
        <button
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition",
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
            "rounded-full px-4 py-1.5 text-xs font-semibold transition",
            cycle === "yearly"
              ? "bg-white/15 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200",
          )}
          onClick={() => setCycle("yearly")}
          type="button"
        >
          Yearly
        </button>
      </div>

      <p className="inline-flex items-end gap-1.5 text-zinc-400">
        <span className="text-4xl font-semibold text-white">{price.value}</span>
        <span className="text-sm">{price.suffix}</span>
      </p>

      <Button
        className="h-10 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90"
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
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
