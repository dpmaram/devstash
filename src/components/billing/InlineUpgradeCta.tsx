"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "annual";

type CheckoutApiResponse = {
  success: boolean;
  error?: string;
  url?: string;
};

type InlineUpgradeCtaProps = {
  cancelPath: string;
  className?: string;
  contextLabel?: string;
};

export function InlineUpgradeCta({
  cancelPath,
  className,
  contextLabel,
}: InlineUpgradeCtaProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          billingCycle,
        }),
      });

      const body = (await response.json()) as CheckoutApiResponse;

      if (response.status === 401) {
        window.location.assign(
          `/sign-in?callbackUrl=${encodeURIComponent(cancelPath)}`,
        );
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
    <div className={cn("space-y-3", className)}>
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
        disabled={isSubmitting}
        onClick={handleUpgrade}
        type="button"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
        ) : null}
        {contextLabel ? `Upgrade to unlock ${contextLabel}` : "Upgrade to Pro"}
      </Button>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
