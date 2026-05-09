import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("stripe portal route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/stripe/portal/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns 401 when user is not signed in", async () => {
    const { handleStripePortalPost } = await import(
      "./app/api/stripe/portal/route-handler"
    );

    const response = await handleStripePortalPost(
      new Request("http://localhost/api/stripe/portal", { method: "POST" }),
      {
        auth: async () => null,
        getAppBaseUrl: () => "http://localhost:3000",
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        getStripeServerClient: () => {
          throw new Error("getStripeServerClient should not be called");
        },
        getUserBillingState: async () => {
          throw new Error("getUserBillingState should not be called");
        },
      },
    );

    assert.equal(response.status, 401);
  });

  it("returns billing portal URL for linked Stripe customer", async () => {
    const { handleStripePortalPost } = await import(
      "./app/api/stripe/portal/route-handler"
    );

    const response = await handleStripePortalPost(
      new Request("http://localhost/api/stripe/portal", { method: "POST" }),
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
          expires: "",
        }),
        getAppBaseUrl: () => "http://localhost:3000",
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
        getStripeServerClient: () => ({
          billingPortal: {
            sessions: {
              create: async () => ({
                url: "https://billing.stripe.com/session/abc",
              }),
            },
          },
        }),
        getUserBillingState: async () => ({
          id: "user_123",
          planTier: "PRO",
          isPro: true,
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
        }),
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      url: "https://billing.stripe.com/session/abc",
    });
  });
});
