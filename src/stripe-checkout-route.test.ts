import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("stripe checkout route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/stripe/checkout/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns 401 when the user is not signed in", async () => {
    const { handleStripeCheckoutPost } = await import(
      "./app/api/stripe/checkout/route-handler"
    );

    const response = await handleStripeCheckoutPost(
      new Request("http://localhost/api/stripe/checkout", { method: "POST" }),
      {
        auth: async () => null,
        getAppBaseUrl: () => "http://localhost:3000",
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        getStripePriceIdForCycle: () => "price_monthly",
        getStripeServerClient: () => {
          throw new Error("getStripeServerClient should not be called");
        },
        getUserBillingState: async () => {
          throw new Error("getUserBillingState should not be called");
        },
        setStripeCustomerId: async () => {
          throw new Error("setStripeCustomerId should not be called");
        },
      },
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("creates a checkout session and returns the redirect URL", async () => {
    const { handleStripeCheckoutPost } = await import(
      "./app/api/stripe/checkout/route-handler"
    );

    const response = await handleStripeCheckoutPost(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billingCycle: "annual" }),
      }),
      {
        auth: async () => ({
          user: {
            id: "signed_in_user",
            email: "demo@devstash.io",
          },
          expires: "",
        }),
        getAppBaseUrl: () => "http://localhost:3000",
        getDashboardUserForSession: async () => ({
          id: "dashboard_user",
        }),
        getStripePriceIdForCycle: (cycle) =>
          cycle === "annual" ? "price_annual" : "price_monthly",
        getStripeServerClient: () => ({
          customers: {
            create: async () => ({ id: "cus_123" }),
          },
          checkout: {
            sessions: {
              create: async (input) => {
                assert.equal(input.line_items[0].price, "price_annual");
                return {
                  id: "cs_123",
                  url: "https://checkout.stripe.com/session/cs_123",
                };
              },
            },
          },
        }),
        getUserBillingState: async () => ({
          id: "dashboard_user",
          planTier: "FREE",
          isPro: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        }),
        setStripeCustomerId: async () => ({
          id: "dashboard_user",
          planTier: "FREE",
          isPro: false,
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: null,
        }),
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      url: "https://checkout.stripe.com/session/cs_123",
    });
  });
});
