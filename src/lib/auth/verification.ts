import { createHash } from "node:crypto";

type VerificationTokenRecord = {
  identifier: string;
  token: string;
  expires: Date;
};

export type VerifyEmailTokenDeps = {
  hashVerificationToken: (token: string) => string;
  findVerificationToken: (
    hashedToken: string,
  ) => Promise<VerificationTokenRecord | null>;
  markEmailVerified: (email: string) => Promise<void>;
  deleteVerificationToken: (hashedToken: string) => Promise<void>;
  deleteVerificationTokensForIdentifier: (identifier: string) => Promise<void>;
  now: () => Date;
};

export type VerifyEmailTokenResult =
  | {
      ok: true;
      status: "success";
      email: string;
    }
  | {
      ok: false;
      status: "invalid" | "expired";
      error: string;
    };

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function findVerificationToken(hashedToken: string) {
  const { prisma } = await import("../prisma");

  return prisma.verificationToken.findUnique({
    where: {
      token: hashedToken,
    },
  });
}

async function markEmailVerified(email: string) {
  const { prisma } = await import("../prisma");

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      emailVerified: new Date(),
    },
  });
}

async function deleteVerificationToken(hashedToken: string) {
  const { prisma } = await import("../prisma");

  await prisma.verificationToken.deleteMany({
    where: {
      token: hashedToken,
    },
  });
}

async function deleteVerificationTokensForIdentifier(identifier: string) {
  const { prisma } = await import("../prisma");

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });
}

const defaultDeps: VerifyEmailTokenDeps = {
  hashVerificationToken,
  findVerificationToken,
  markEmailVerified,
  deleteVerificationToken,
  deleteVerificationTokensForIdentifier,
  now: () => new Date(),
};

export async function verifyEmailToken(
  input: {
    email?: unknown;
    token?: unknown;
  },
  deps: VerifyEmailTokenDeps = defaultDeps,
): Promise<VerifyEmailTokenResult> {
  const email = getString(input.email);
  const token = getString(input.token);

  if (!email || !token) {
    return {
      ok: false,
      status: "invalid",
      error: "Verification link is invalid.",
    };
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      ok: false,
      status: "invalid",
      error: "Verification link is invalid.",
    };
  }

  const hashedToken = deps.hashVerificationToken(token);
  const verificationToken = await deps.findVerificationToken(hashedToken);

  if (!verificationToken || verificationToken.identifier !== normalizedEmail) {
    return {
      ok: false,
      status: "invalid",
      error: "Verification link is invalid.",
    };
  }

  if (verificationToken.expires <= deps.now()) {
    await deps.deleteVerificationToken(hashedToken);

    return {
      ok: false,
      status: "expired",
      error: "Verification link has expired.",
    };
  }

  await deps.markEmailVerified(normalizedEmail);
  await deps.deleteVerificationToken(hashedToken);
  await deps.deleteVerificationTokensForIdentifier(normalizedEmail);

  return {
    ok: true,
    status: "success",
    email: normalizedEmail,
  };
}
