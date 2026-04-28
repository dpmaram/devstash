import bcrypt from "bcryptjs";
import { CredentialsSignin, type User } from "next-auth";

import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { isEmailVerificationEnabled } from "./email-verification";

type CredentialsInput = Partial<Record<"email" | "password", unknown>>;

type CredentialsUserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
};

export type AuthorizeCredentialsDeps = {
  findUserByEmail: (email: string) => Promise<CredentialsUserRecord | null>;
  verifyPassword: (password: string, passwordHash: string) => Promise<boolean>;
  emailVerificationEnabled: boolean;
  checkRateLimit?: (
    request: Request | undefined,
    email: string,
  ) => Promise<RateLimitResult>;
};

type AuthorizeCredentialsOptions = {
  request?: Request;
};

function createRateLimitedCredentialsCode(retryAfter: number) {
  const retryAfterSeconds = Number.isFinite(retryAfter)
    ? Math.max(1, Math.ceil(retryAfter))
    : 60;

  return `rate_limited_${retryAfterSeconds}`;
}

export class RateLimitedCredentialsSignin extends CredentialsSignin {
  constructor(retryAfter: number) {
    super();
    this.code = createRateLimitedCredentialsCode(retryAfter);
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseCredentials(credentials: CredentialsInput) {
  const email = getString(credentials.email);
  const password = getString(credentials.password);

  if (!email || !password) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  return {
    email: normalizedEmail,
    password,
  };
}

async function findUserByEmail(email: string) {
  const { prisma } = await import("../prisma");

  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      passwordHash: true,
      emailVerified: true,
    },
  });
}

const defaultDeps: AuthorizeCredentialsDeps = {
  findUserByEmail,
  verifyPassword: (password, passwordHash) => bcrypt.compare(password, passwordHash),
  emailVerificationEnabled: isEmailVerificationEnabled(),
  checkRateLimit: async (request, email) => {
    if (!request) {
      return {
        success: true,
        limit: Number.POSITIVE_INFINITY,
        remaining: Number.POSITIVE_INFINITY,
        reset: 0,
        retryAfter: 0,
      };
    }

    return checkRateLimit("credentialsLogin", request, {
      identifier: email,
    });
  },
};

export async function authorizeCredentials(
  credentials: CredentialsInput,
  deps: AuthorizeCredentialsDeps = defaultDeps,
  options: AuthorizeCredentialsOptions = {},
): Promise<User | null> {
  const parsedCredentials = parseCredentials(credentials);

  if (!parsedCredentials) {
    return null;
  }

  const rateLimitResult = await deps.checkRateLimit?.(
    options.request,
    parsedCredentials.email,
  );

  if (rateLimitResult && !rateLimitResult.success) {
    throw new RateLimitedCredentialsSignin(rateLimitResult.retryAfter);
  }

  const user = await deps.findUserByEmail(parsedCredentials.email);

  if (!user?.passwordHash) {
    return null;
  }

  if (deps.emailVerificationEnabled && !user.emailVerified) {
    return null;
  }

  const passwordIsValid = await deps.verifyPassword(
    parsedCredentials.password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}
