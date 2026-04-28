import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { sendResendEmail } from "@/lib/email/resend";
import { hashVerificationToken } from "./verification";

type PasswordResetUser = {
  id: string;
  name: string | null;
  email: string | null;
  passwordHash: string | null;
};

type ResetTokenRecord = {
  identifier: string;
  token: string;
  expires: Date;
};

type ResetUrlInput = {
  email: string;
  token: string;
};

type ResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

export type RequestPasswordResetDeps = {
  findUserByEmail: (email: string) => Promise<PasswordResetUser | null>;
  generateResetToken: () => string;
  hashResetToken: (token: string) => string;
  createResetToken: (data: {
    identifier: string;
    token: string;
    expires: Date;
  }) => Promise<void>;
  createResetUrl: (input: ResetUrlInput) => string;
  sendResetEmail: (input: ResetEmailInput) => Promise<void>;
  now: () => Date;
  resetTokenTtlMs: number;
};

export type ResetPasswordDeps = {
  hashResetToken: (token: string) => string;
  findResetToken: (hashedToken: string) => Promise<ResetTokenRecord | null>;
  hashPassword: (password: string) => Promise<string>;
  updateUserPassword: (email: string, passwordHash: string) => Promise<void>;
  deleteResetToken: (hashedToken: string) => Promise<void>;
  deleteResetTokensForIdentifier: (identifier: string) => Promise<void>;
  now: () => Date;
};

export type RequestPasswordResetResult =
  | {
      ok: true;
      status: 200;
      message: string;
    }
  | {
      ok: false;
      status: 400;
      error: string;
    };

export type ResetPasswordResult =
  | {
      ok: true;
      status: 200;
      resetStatus: "success";
      message: string;
    }
  | {
      ok: false;
      status: 400;
      resetStatus: "invalid" | "expired";
      error: string;
    };

const passwordResetSuccessMessage =
  "If an account exists for that email, we'll send password reset instructions.";

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

export function getPasswordResetIdentifier(email: string) {
  return `password-reset:${normalizeEmail(email)}`;
}

function parseEmail(input: unknown) {
  if (!isObjectRecord(input)) {
    return null;
  }

  const email = getString(input.email);

  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);

  return isValidEmail(normalizedEmail) ? normalizedEmail : null;
}

function parseResetPasswordInput(input: unknown) {
  if (!isObjectRecord(input)) {
    return {
      ok: false,
      status: 400,
      resetStatus: "invalid",
      error: "Password reset link is invalid.",
    } as const;
  }

  const email = parseEmail(input);
  const token = getString(input.token)?.trim();
  const password = getString(input.password);
  const confirmPassword = getString(input.confirmPassword);

  if (!email || !token || !password || !confirmPassword) {
    return {
      ok: false,
      status: 400,
      resetStatus: "invalid",
      error: "Password reset link is invalid.",
    } as const;
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      status: 400,
      resetStatus: "invalid",
      error: "Passwords do not match.",
    } as const;
  }

  return {
    ok: true,
    value: {
      email,
      token,
      password,
    },
  } as const;
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
      passwordHash: true,
    },
  });
}

function generateResetToken() {
  return randomBytes(32).toString("hex");
}

async function createResetToken(data: {
  identifier: string;
  token: string;
  expires: Date;
}) {
  const { prisma } = await import("../prisma");

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: data.identifier,
    },
  });
  await prisma.verificationToken.create({
    data,
  });
}

function getAppBaseUrl(baseUrl?: string) {
  const configuredBaseUrl =
    baseUrl ?? process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL;

  return (configuredBaseUrl ?? "http://localhost:3000").replace(/\/+$/, "");
}

function createResetUrl(input: ResetUrlInput, baseUrl?: string) {
  const url = new URL("/reset-password", getAppBaseUrl(baseUrl));

  url.searchParams.set("email", input.email);
  url.searchParams.set("token", input.token);

  return url.toString();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function createResetEmailHtml(input: ResetEmailInput) {
  const name = escapeHtml(input.name);
  const resetUrl = escapeHtml(input.resetUrl);

  return `<p>Hi ${name},</p><p>Click the link below to reset your DevStash password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`;
}

function createResetEmailText(input: ResetEmailInput) {
  return `Hi ${input.name},

Reset your DevStash password:
${input.resetUrl}

If you did not request a password reset, you can ignore this email.`;
}

async function sendResetEmail(input: ResetEmailInput) {
  await sendResendEmail({
    to: input.to,
    subject: "Reset your DevStash password",
    html: createResetEmailHtml(input),
    text: createResetEmailText(input),
    idempotencyKey: `password-reset:${hashVerificationToken(input.resetUrl).slice(
      0,
      64,
    )}`,
  });
}

async function findResetToken(hashedToken: string) {
  const { prisma } = await import("../prisma");

  return prisma.verificationToken.findUnique({
    where: {
      token: hashedToken,
    },
  });
}

async function updateUserPassword(email: string, passwordHash: string) {
  const { prisma } = await import("../prisma");

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      passwordHash,
    },
  });
}

async function deleteResetToken(hashedToken: string) {
  const { prisma } = await import("../prisma");

  await prisma.verificationToken.deleteMany({
    where: {
      token: hashedToken,
    },
  });
}

async function deleteResetTokensForIdentifier(identifier: string) {
  const { prisma } = await import("../prisma");

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });
}

export function createRequestPasswordResetDeps(
  options: { baseUrl?: string } = {},
) {
  return {
    findUserByEmail,
    generateResetToken,
    hashResetToken: hashVerificationToken,
    createResetToken,
    createResetUrl: (input: ResetUrlInput) => createResetUrl(input, options.baseUrl),
    sendResetEmail,
    now: () => new Date(),
    resetTokenTtlMs: 60 * 60 * 1000,
  } satisfies RequestPasswordResetDeps;
}

export function createResetPasswordDeps() {
  return {
    hashResetToken: hashVerificationToken,
    findResetToken,
    hashPassword: (password: string) => bcrypt.hash(password, 12),
    updateUserPassword,
    deleteResetToken,
    deleteResetTokensForIdentifier,
    now: () => new Date(),
  } satisfies ResetPasswordDeps;
}

export async function requestPasswordReset(
  input: unknown,
  deps: RequestPasswordResetDeps = createRequestPasswordResetDeps(),
): Promise<RequestPasswordResetResult> {
  const email = parseEmail(input);

  if (!email) {
    return {
      ok: false,
      status: 400,
      error: "Enter a valid email address.",
    };
  }

  const genericSuccess = {
    ok: true,
    status: 200,
    message: passwordResetSuccessMessage,
  } as const;
  const user = await deps.findUserByEmail(email);

  if (!user?.email || !user.passwordHash) {
    return genericSuccess;
  }

  const resetToken = deps.generateResetToken();
  const hashedResetToken = deps.hashResetToken(resetToken);
  const identifier = getPasswordResetIdentifier(email);
  const resetUrl = deps.createResetUrl({
    email,
    token: resetToken,
  });
  const expires = new Date(deps.now().getTime() + deps.resetTokenTtlMs);

  try {
    await deps.sendResetEmail({
      to: email,
      name: user.name ?? email,
      resetUrl,
    });
    await deps.createResetToken({
      identifier,
      token: hashedResetToken,
      expires,
    });
  } catch {
    return genericSuccess;
  }

  return genericSuccess;
}

export async function resetPassword(
  input: unknown,
  deps: ResetPasswordDeps = createResetPasswordDeps(),
): Promise<ResetPasswordResult> {
  const parsedInput = parseResetPasswordInput(input);

  if (!parsedInput.ok) {
    return parsedInput;
  }

  const hashedResetToken = deps.hashResetToken(parsedInput.value.token);
  const resetToken = await deps.findResetToken(hashedResetToken);
  const identifier = getPasswordResetIdentifier(parsedInput.value.email);

  if (!resetToken || resetToken.identifier !== identifier) {
    return {
      ok: false,
      status: 400,
      resetStatus: "invalid",
      error: "Password reset link is invalid.",
    };
  }

  if (resetToken.expires <= deps.now()) {
    await deps.deleteResetToken(hashedResetToken);

    return {
      ok: false,
      status: 400,
      resetStatus: "expired",
      error: "Password reset link has expired.",
    };
  }

  const passwordHash = await deps.hashPassword(parsedInput.value.password);

  await deps.updateUserPassword(parsedInput.value.email, passwordHash);
  await deps.deleteResetToken(hashedResetToken);
  await deps.deleteResetTokensForIdentifier(identifier);

  return {
    ok: true,
    status: 200,
    resetStatus: "success",
    message: "Password reset. You can now sign in.",
  };
}
