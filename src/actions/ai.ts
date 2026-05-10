"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { AI_MODEL, getOpenAIClient } from "@/lib/ai/openai-client";
import { getUserBillingState } from "@/lib/db/billing";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { checkUserRateLimit } from "@/lib/rate-limit";

const autoTagSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(1_000).optional().default(""),
  content: z.string().max(20_000).optional().default(""),
  tags: z.array(z.string().trim().min(1)).default([]),
});

const autoDescriptionSchema = z.object({
  typeSlug: z.string().trim().max(32).optional().default(""),
  title: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(1_000).optional().default(""),
  content: z.string().max(20_000).optional().default(""),
  url: z.string().trim().max(2_000).optional().default(""),
  fileName: z.string().trim().max(260).optional().default(""),
  language: z.string().trim().max(120).optional().default(""),
  tags: z.array(z.string().trim().min(1)).default([]),
});

type AutoTagResponseClient = {
  responses: {
    create: (input: {
      model: string;
      instructions: string;
      input: string;
      text?: {
        format: {
          type: "json_object";
        };
      };
    }) => Promise<{
      output_text?: string | null;
    }>;
  };
};

type GenerateAutoTagsDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  checkUserRateLimit: typeof checkUserRateLimit;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  getOpenAIClient: () => AutoTagResponseClient | null;
  getUserBillingState: typeof getUserBillingState;
};

type GenerateAutoTagsResult =
  | {
      success: true;
      data: {
        tags: string[];
      };
    }
  | {
      success: false;
      error: string;
    };

const defaultDeps: GenerateAutoTagsDeps = {
  auth,
  checkUserRateLimit,
  getDashboardUserForSession,
  getOpenAIClient,
  getUserBillingState,
};

function normalizeTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^#+/, "")
    .replace(/,+$/, "");
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map(normalizeTag).filter(Boolean))];
}

function parseTags(outputText: string) {
  try {
    const parsed = JSON.parse(outputText) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string");
    }

    if (parsed && typeof parsed === "object") {
      const candidateTags = (parsed as { tags?: unknown }).tags;

      if (Array.isArray(candidateTags)) {
        return candidateTags.filter(
          (value): value is string => typeof value === "string",
        );
      }
    }

    return [];
  } catch {
    return [];
  }
}

function buildModelInput(input: z.infer<typeof autoTagSchema>) {
  const truncatedContent = input.content.slice(0, 2_000);
  const existingTags = normalizeTags(input.tags);

  return [
    "Suggest 3-5 concise tags for a developer knowledge item.",
    "Return JSON only with either {\"tags\":[...]} or an array [...].",
    "Do not include markdown formatting or explanations.",
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : "Description: (none)",
    truncatedContent ? `Content: ${truncatedContent}` : "Content: (none)",
    existingTags.length > 0
      ? `Existing tags (avoid duplicates): ${existingTags.join(", ")}`
      : "Existing tags: (none)",
  ].join("\n");
}

function buildDescriptionInput(input: z.infer<typeof autoDescriptionSchema>) {
  const truncatedContent = input.content.slice(0, 2_000).trim();
  const existingTags = normalizeTags(input.tags);
  const lines = [
    "Write a concise description summary for this developer knowledge item.",
    "Output plain text only.",
    "Use 1 sentence by default and at most 2 short sentences.",
  ];

  if (input.typeSlug) {
    lines.push(`Type: ${input.typeSlug}`);
  }

  if (input.title) {
    lines.push(`Title: ${input.title}`);
  }

  if (input.description) {
    lines.push(`Current description: ${input.description}`);
  }

  if (truncatedContent) {
    lines.push(`Content: ${truncatedContent}`);
  }

  if (input.url) {
    lines.push(`URL: ${input.url}`);
  }

  if (input.fileName) {
    lines.push(`File name: ${input.fileName}`);
  }

  if (input.language) {
    lines.push(`Language: ${input.language}`);
  }

  if (existingTags.length > 0) {
    lines.push(`Tags: ${existingTags.join(", ")}`);
  }

  return lines.join("\n");
}

function hasDescriptionContext(input: z.infer<typeof autoDescriptionSchema>) {
  return Boolean(
    input.title ||
      input.description ||
      input.content.trim() ||
      input.url ||
      input.fileName ||
      input.language ||
      input.tags.length > 0,
  );
}

function normalizeDescriptionSummary(summary: string) {
  const cleaned = summary
    .replace(/\s+/g, " ")
    .replace(/^[-*]\s+/, "")
    .trim();

  if (!cleaned) {
    return "";
  }

  const sentenceParts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const limited = sentenceParts.slice(0, 2).join(" ").trim();

  if (limited) {
    return limited;
  }

  return cleaned.slice(0, 280).trim();
}

export async function handleGenerateAutoTags(
  data: unknown,
  deps: GenerateAutoTagsDeps = defaultDeps,
): Promise<GenerateAutoTagsResult> {
  const parsedData = autoTagSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      error: parsedData.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const session = await deps.auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const dashboardUser = await deps.getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return {
      success: false,
      error: "Unable to generate tag suggestions.",
    };
  }

  const billingState = await deps.getUserBillingState(dashboardUser.id);

  if (!billingState?.isPro) {
    return {
      success: false,
      error: "AI tag suggestions are available on Pro plans only.",
    };
  }

  const rateLimitResult = await deps.checkUserRateLimit(
    "aiAutoTags",
    dashboardUser.id,
  );

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: `AI tag suggestion limit reached. ${rateLimitResult.error}`,
    };
  }

  const client = deps.getOpenAIClient();

  if (!client) {
    return {
      success: false,
      error: "AI service is not configured yet.",
    };
  }

  try {
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You generate short, useful lowercase tags for developer content.",
      input: buildModelInput(parsedData.data),
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const parsedTags = parseTags(response.output_text ?? "");
    const existingTags = new Set(normalizeTags(parsedData.data.tags));
    const suggestedTags = normalizeTags(parsedTags)
      .filter((tag) => !existingTags.has(tag))
      .slice(0, 5);

    if (suggestedTags.length === 0) {
      return {
        success: false,
        error: "Unable to generate tag suggestions right now.",
      };
    }

    return {
      success: true,
      data: {
        tags: suggestedTags,
      },
    };
  } catch (error) {
    console.error("generateAutoTags error:", error);

    return {
      success: false,
      error: "Unable to generate tag suggestions right now.",
    };
  }
}

export async function generateAutoTags(data: unknown) {
  return handleGenerateAutoTags(data);
}

type GenerateAutoDescriptionResult =
  | {
      success: true;
      data: {
        description: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function handleGenerateAutoDescription(
  data: unknown,
  deps: GenerateAutoTagsDeps = defaultDeps,
): Promise<GenerateAutoDescriptionResult> {
  const parsedData = autoDescriptionSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      error: parsedData.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  if (!hasDescriptionContext(parsedData.data)) {
    return {
      success: false,
      error: "Add a title, content, URL, or file name first.",
    };
  }

  const session = await deps.auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const dashboardUser = await deps.getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return {
      success: false,
      error: "Unable to generate a description right now.",
    };
  }

  const billingState = await deps.getUserBillingState(dashboardUser.id);

  if (!billingState?.isPro) {
    return {
      success: false,
      error: "AI description suggestions are available on Pro plans only.",
    };
  }

  const rateLimitResult = await deps.checkUserRateLimit(
    "aiAutoTags",
    dashboardUser.id,
  );

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: `AI description suggestion limit reached. ${rateLimitResult.error}`,
    };
  }

  const client = deps.getOpenAIClient();

  if (!client) {
    return {
      success: false,
      error: "AI service is not configured yet.",
    };
  }

  try {
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You write concise descriptions for developer notes. Return plain text in one short sentence unless a second sentence adds essential clarity.",
      input: buildDescriptionInput(parsedData.data),
    });

    const description = normalizeDescriptionSummary(response.output_text ?? "");

    if (!description) {
      return {
        success: false,
        error: "Unable to generate a description right now.",
      };
    }

    return {
      success: true,
      data: {
        description,
      },
    };
  } catch (error) {
    console.error("generateAutoDescription error:", error);

    return {
      success: false,
      error: "Unable to generate a description right now.",
    };
  }
}

export async function generateAutoDescription(data: unknown) {
  return handleGenerateAutoDescription(data);
}