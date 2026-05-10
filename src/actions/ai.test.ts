import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("generateAutoTags action", () => {
  it("rejects invalid payloads before auth", async () => {
    const { handleGenerateAutoTags } = await import("./ai");

    const result = await handleGenerateAutoTags(
      {
        title: "",
      },
      {
        auth: async () => {
          throw new Error("auth should not be called");
        },
        checkUserRateLimit: async () => {
          throw new Error("checkUserRateLimit should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        getOpenAIClient: () => {
          throw new Error("getOpenAIClient should not be called");
        },
        getUserBillingState: async () => {
          throw new Error("getUserBillingState should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Title is required.",
    });
  });

  it("requires a signed-in user", async () => {
    const { handleGenerateAutoTags } = await import("./ai");

    const result = await handleGenerateAutoTags(
      {
        title: "Rate limiting notes",
      },
      {
        auth: async () => null,
        checkUserRateLimit: async () => {
          throw new Error("checkUserRateLimit should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        getOpenAIClient: () => {
          throw new Error("getOpenAIClient should not be called");
        },
        getUserBillingState: async () => {
          throw new Error("getUserBillingState should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("blocks free-tier users", async () => {
    const { handleGenerateAutoTags } = await import("./ai");

    const result = await handleGenerateAutoTags(
      {
        title: "React hook",
      },
      {
        auth: async () => ({
          user: {
            id: "signed-in-user",
          },
        }),
        checkUserRateLimit: async () => {
          throw new Error("checkUserRateLimit should not be called");
        },
        getDashboardUserForSession: async () => ({
          id: "dashboard-user",
        }),
        getOpenAIClient: () => {
          throw new Error("getOpenAIClient should not be called");
        },
        getUserBillingState: async () => ({
          id: "dashboard-user",
          isPro: false,
          planTier: "FREE",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        }),
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "AI tag suggestions are available on Pro plans only.",
    });
  });

  it("returns a rate-limit error when AI requests are exhausted", async () => {
    const { handleGenerateAutoTags } = await import("./ai");

    const result = await handleGenerateAutoTags(
      {
        title: "CLI snippets",
      },
      {
        auth: async () => ({
          user: {
            id: "signed-in-user",
          },
        }),
        checkUserRateLimit: async () => ({
          success: false,
          limit: 20,
          remaining: 0,
          reset: Date.now() + 120_000,
          retryAfter: 120,
          error: "Too many attempts. Please try again in 2 minutes.",
        }),
        getDashboardUserForSession: async () => ({
          id: "dashboard-user",
        }),
        getOpenAIClient: () => {
          throw new Error("getOpenAIClient should not be called");
        },
        getUserBillingState: async () => ({
          id: "dashboard-user",
          isPro: true,
          planTier: "PRO",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: false,
      error:
        "AI tag suggestion limit reached. Too many attempts. Please try again in 2 minutes.",
    });
  });

  it("normalizes, deduplicates, and filters out existing tags", async () => {
    const { handleGenerateAutoTags } = await import("./ai");

    const result = await handleGenerateAutoTags(
      {
        title: "Auth middleware",
        description: "Session and route guards",
        content: "middleware logic",
        tags: ["nextjs", "auth"],
      },
      {
        auth: async () => ({
          user: {
            id: "signed-in-user",
          },
        }),
        checkUserRateLimit: async () => ({
          success: true,
          limit: 20,
          remaining: 19,
          reset: Date.now() + 3_600_000,
          retryAfter: 0,
        }),
        getDashboardUserForSession: async () => ({
          id: "dashboard-user",
        }),
        getOpenAIClient: () => ({
          responses: {
            create: async () => ({
              output_text:
                '{"tags":["Auth","NextJS","middleware","security","middleware"]}',
            }),
          },
        }),
        getUserBillingState: async () => ({
          id: "dashboard-user",
          isPro: true,
          planTier: "PRO",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: {
        tags: ["middleware", "security"],
      },
    });
  });

  it("parses array JSON responses", async () => {
    const { handleGenerateAutoTags } = await import("./ai");

    const result = await handleGenerateAutoTags(
      {
        title: "Prompt template",
      },
      {
        auth: async () => ({
          user: {
            id: "signed-in-user",
          },
        }),
        checkUserRateLimit: async () => ({
          success: true,
          limit: 20,
          remaining: 18,
          reset: Date.now() + 3_600_000,
          retryAfter: 0,
        }),
        getDashboardUserForSession: async () => ({
          id: "dashboard-user",
        }),
        getOpenAIClient: () => ({
          responses: {
            create: async () => ({
              output_text: '["prompt-engineering","templates","llm"]',
            }),
          },
        }),
        getUserBillingState: async () => ({
          id: "dashboard-user",
          isPro: true,
          planTier: "PRO",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: {
        tags: ["prompt-engineering", "templates", "llm"],
      },
    });
  });
});