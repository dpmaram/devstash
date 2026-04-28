import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitRule =
  | "credentialsLogin"
  | "register"
  | "forgotPassword"
  | "resetPassword"
  | "resendVerification"
  | "changePassword";

type RateLimitRuleConfig = {
  limit: number;
  window: `${number} ${"m" | "h"}`;
  keyPrefix: string;
};

type RateLimitBackendResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type RateLimiterClient = {
  limit: (identifier: string) => Promise<RateLimitBackendResult>;
};

export type RateLimitDeps = {
  limit: (
    rule: RateLimitRule,
    identifier: string,
  ) => Promise<RateLimitBackendResult | null>;
  now: () => number;
};

export type RateLimitAllowedResult = {
  success: true;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: 0;
};

export type RateLimitBlockedResult = {
  success: false;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
  error: string;
};

export type RateLimitResult = RateLimitAllowedResult | RateLimitBlockedResult;

export const authRateLimitRules = {
  credentialsLogin: {
    limit: 5,
    window: "15 m",
    keyPrefix: "auth:credentials-login",
  },
  register: {
    limit: 3,
    window: "1 h",
    keyPrefix: "auth:register",
  },
  forgotPassword: {
    limit: 3,
    window: "1 h",
    keyPrefix: "auth:forgot-password",
  },
  resetPassword: {
    limit: 5,
    window: "15 m",
    keyPrefix: "auth:reset-password",
  },
  resendVerification: {
    limit: 3,
    window: "15 m",
    keyPrefix: "auth:resend-verification",
  },
  changePassword: {
    limit: 5,
    window: "15 m",
    keyPrefix: "auth:change-password",
  },
} satisfies Record<RateLimitRule, RateLimitRuleConfig>;

const limiterCache = new Map<RateLimitRule, RateLimiterClient>();

function hasUpstashEnv() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRateLimiter(rule: RateLimitRule) {
  if (!hasUpstashEnv()) {
    return null;
  }

  const cachedLimiter = limiterCache.get(rule);

  if (cachedLimiter) {
    return cachedLimiter;
  }

  const ruleConfig = authRateLimitRules[rule];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(ruleConfig.limit, ruleConfig.window),
    prefix: ruleConfig.keyPrefix,
    timeout: 1_000,
  });

  limiterCache.set(rule, limiter);

  return limiter;
}

const defaultRateLimitDeps: RateLimitDeps = {
  limit: async (rule, identifier) => {
    const limiter = getRateLimiter(rule);

    if (!limiter) {
      return null;
    }

    return limiter.limit(identifier);
  },
  now: Date.now,
};

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",").at(0)?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
}

export function createRateLimitKey(
  rule: RateLimitRule,
  request: Request,
  options: {
    identifier?: string | null;
  } = {},
) {
  const segments = [authRateLimitRules[rule].keyPrefix, getClientIp(request)];
  const identifier = options.identifier?.trim();

  if (identifier) {
    segments.push(normalizeIdentifier(identifier));
  }

  return segments.join(":");
}

function createAllowedResult(
  result: RateLimitBackendResult | null,
): RateLimitAllowedResult {
  return {
    success: true,
    limit: result?.limit ?? Number.POSITIVE_INFINITY,
    remaining: result?.remaining ?? Number.POSITIVE_INFINITY,
    reset: result?.reset ?? 0,
    retryAfter: 0,
  };
}

function formatRateLimitError(retryAfter: number) {
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  const unit = minutes === 1 ? "minute" : "minutes";

  return `Too many attempts. Please try again in ${minutes} ${unit}.`;
}

export async function checkRateLimit(
  rule: RateLimitRule,
  request: Request,
  options: {
    identifier?: string | null;
  } = {},
  deps: RateLimitDeps = defaultRateLimitDeps,
): Promise<RateLimitResult> {
  const key = createRateLimitKey(rule, request, options);

  try {
    const result = await deps.limit(rule, key);

    if (!result?.success) {
      if (!result) {
        return createAllowedResult(result);
      }

      const retryAfter = Math.max(
        1,
        Math.ceil((result.reset - deps.now()) / 1_000),
      );

      return {
        success: false,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter,
        error: formatRateLimitError(retryAfter),
      };
    }

    return createAllowedResult(result);
  } catch {
    return createAllowedResult(null);
  }
}

export function createTooManyRequestsResponse(
  result: RateLimitBlockedResult,
  body: Record<string, unknown> = {},
) {
  return Response.json(
    {
      success: false,
      ...body,
      error: result.error,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
      },
    },
  );
}
