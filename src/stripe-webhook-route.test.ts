import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type Stripe from "stripe";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("stripe webhook route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/stripe/webhook/route");

    assert.equal(typeof route.POST, "function");
  });

  it("rejects requests without signature header", async () => {
    const { handleStripeWebhookPost } = await import(
      "./app/api/stripe/webhook/route-handler"
    );

    const response = await handleStripeWebhookPost(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
      {
        activateProBilling: async () => {
          throw new Error("activateProBilling should not be called");
        },
        activateProBillingByStripeCustomerId: async () => {
          throw new Error(
            "activateProBillingByStripeCustomerId should not be called",
          );
        },
        deactivateProBillingByStripeCustomerId: async () => {
          throw new Error(
            "deactivateProBillingByStripeCustomerId should not be called",
          );
        },
        getStripeServerClient: () => {
          throw new Error("getStripeServerClient should not be called");
        },
        getStripeWebhookSecret: () => "whsec_123",
      },
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Missing Stripe signature.",
    });
  });

  it("processes checkout.session.completed events", async () => {
    const { handleStripeWebhookPost } = await import(
      "./app/api/stripe/webhook/route-handler"
    );
    const calls: string[] = [];

    const response = await handleStripeWebhookPost(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: {
          "stripe-signature": "test-signature",
        },
      }),
      {
        activateProBilling: async () => {
          calls.push("activateProBilling");
          return {
            id: "user_123",
            planTier: "PRO",
            isPro: true,
            stripeCustomerId: "cus_123",
            stripeSubscriptionId: "sub_123",
          };
        },
        activateProBillingByStripeCustomerId: async () => {
          calls.push("activateProBillingByStripeCustomerId");
          return null;
        },
        deactivateProBillingByStripeCustomerId: async () => {
          calls.push("deactivateProBillingByStripeCustomerId");
          return null;
        },
        getStripeServerClient: () => ({
          webhooks: {
            constructEvent: () =>
              ({
                type: "checkout.session.completed",
                data: {
                  object: {
                    customer: "cus_123",
                    subscription: "sub_123",
                    metadata: {
                      userId: "user_123",
                    },
                  },
                },
              }) as unknown as Stripe.Event,
          },
        }),
        getStripeWebhookSecret: () => "whsec_123",
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(calls, [
      "activateProBillingByStripeCustomerId",
      "activateProBilling",
    ]);
  });
});
