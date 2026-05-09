"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPanelProps = {
  isPro: boolean;
  planTier: "FREE" | "PRO";
};

type BillingApiResponse = {
  success: boolean;
  error?: string;
  url?: string;
};

export function BillingPanel({ isPro, planTier }: BillingPanelProps) {
  const [isSubmittingPortal, setIsSubmittingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planLabel = useMemo(() => (isPro ? "Pro" : "Free"), [isPro]);

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

      <div className="rounded-lg border border-devstash-line bg-white/[0.08] p-4">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <p className="mt-1 text-lg font-semibold text-white">{planLabel}</p>
        <p className={cn("mt-1 text-sm font-medium", isPro ? "text-blue-300" : "text-muted-foreground")}>
          Plan tier: {planTier}
        </p>
      </div>

      {!isPro ? (
        <Link href="/upgrade">
          <Button className="h-10 w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white hover:opacity-90">
            View Pricing & Upgrade
          </Button>
        </Link>
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
