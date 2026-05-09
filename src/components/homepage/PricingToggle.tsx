"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

export function PricingToggle() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const price = useMemo(
    () =>
      cycle === "monthly"
        ? { value: "$8", suffix: "/mo" }
        : { value: "$72", suffix: "/yr" },
    [cycle],
  );

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
    </div>
  );
}
