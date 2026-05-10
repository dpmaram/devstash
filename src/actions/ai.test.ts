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

describe("generateAutoDescription action", () => {
  it("requires source context before auth", async () => {
    const { handleGenerateAutoDescription } = await import("./ai");

    const result = await handleGenerateAutoDescription(
      {
        title: "",
        content: "",
        url: "",
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
      error: "Add a title, content, URL, or file name first.",
    });
  });

  it("blocks free-tier users", async () => {
    const { handleGenerateAutoDescription } = await import("./ai");

    const result = await handleGenerateAutoDescription(
      {
        title: "Snippet about rate limits",
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
      error: "AI description suggestions are available on Pro plans only.",
    });
  });

  it("returns a normalized 1-2 sentence summary", async () => {
    const { handleGenerateAutoDescription } = await import("./ai");

    const result = await handleGenerateAutoDescription(
      {
        typeSlug: "snippet",
        title: "Rate limiter helper",
        content: "Utility for retry-after and user key generation",
        tags: ["rate-limit", "auth"],
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
                "- A shared helper that enforces per-user rate limits and consistent retry guidance. It centralizes key generation and limit handling across auth and AI flows. Extra sentence that should be removed.",
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
        description:
          "A shared helper that enforces per-user rate limits and consistent retry guidance. It centralizes key generation and limit handling across auth and AI flows.",
      },
    });
  });
});

describe("explainCode action", () => {
  it("validates supported type slug", async () => {
    const { handleExplainCode } = await import("./ai");

    const result = await handleExplainCode(
      {
        typeSlug: "note",
        content: "const x = 1;",
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
      error: 'Invalid option: expected one of "snippet"|"command"',
    });
  });

  it("blocks free-tier users", async () => {
    const { handleExplainCode } = await import("./ai");

    const result = await handleExplainCode(
      {
        typeSlug: "snippet",
        title: "Auth middleware",
        content: "export function middleware(request) { return NextResponse.next(); }",
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
      error: "AI features require Pro subscription.",
    });
  });

  it("returns markdown explanation on success", async () => {
    const { handleExplainCode } = await import("./ai");

    const result = await handleExplainCode(
      {
        typeSlug: "command",
        title: "List git branches",
        content: "git branch --all",
        language: "shell",
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
                "This command lists local and remote branches, helping you inspect branch state across repositories. It is useful for confirming branch names before checkout, merge, or cleanup tasks.",
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
        explanation:
          "This command lists local and remote branches, helping you inspect branch state across repositories. It is useful for confirming branch names before checkout, merge, or cleanup tasks.",
      },
    });
  });
});

describe("optimizePrompt action", () => {
  it("requires prompt content", async () => {
    const { handleOptimizePrompt } = await import("./ai");

    const result = await handleOptimizePrompt(
      {
        typeSlug: "prompt",
        content: "   ",
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
      error: "Prompt content is required.",
    });
  });

  it("blocks free-tier users", async () => {
    const { handleOptimizePrompt } = await import("./ai");

    const result = await handleOptimizePrompt(
      {
        typeSlug: "prompt",
        title: "Summarize release notes",
        content: "Summarize this changelog.",
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
      error: "AI features require Pro subscription.",
    });
  });

  it("returns optimized prompt and marks changed output", async () => {
    const { handleOptimizePrompt } = await import("./ai");

    const result = await handleOptimizePrompt(
      {
        typeSlug: "prompt",
        title: "Generate test plan",
        content: "Create a test plan for this feature.",
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
                "Create a concise test plan for this feature with sections for scope, risks, test cases, and success criteria.",
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
        optimizedPrompt:
          "Create a concise test plan for this feature with sections for scope, risks, test cases, and success criteria.",
        changed: true,
      },
    });
  });

  it("returns changed=false when optimizer output matches original prompt", async () => {
    const { handleOptimizePrompt } = await import("./ai");

    const result = await handleOptimizePrompt(
      {
        typeSlug: "prompt",
        content: "Generate release notes with bullet points.",
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
              output_text: "Generate release notes with bullet points.",
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
        optimizedPrompt: "Generate release notes with bullet points.",
        changed: false,
      },
    });
  });
});