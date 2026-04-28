import { randomBytes } from "node:crypto";

import { sendResendEmail } from "@/lib/email/resend";
import { isEmailVerificationEnabled } from "./email-verification";
import { hashVerificationToken } from "./verification";

type ResendVerificationInput = {
  email?: unknown;
};

type VerificationUser = {
  name: string | null;
  email: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
};

type VerificationUrlInput = {
  email: string;
  token: string;
};

type VerificationEmailInput = {
  to: string;
  name: string;
  verificationUrl: string;
};

export type RequestEmailVerificationDeps = {
  findUserByEmail: (email: string) => Promise<VerificationUser | null>;
  generateVerificationToken: () => string;
  hashVerificationToken: (token: string) => string;
  createVerificationToken: (data: {
    identifier: string;
    token: string;
    expires: Date;
  }) => Promise<void>;
  createVerificationUrl: (input: VerificationUrlInput) => string;
  sendVerificationEmail: (input: VerificationEmailInput) => Promise<void>;
  emailVerificationEnabled: boolean;
  now: () => Date;
  verificationTokenTtlMs: number;
};

export type RequestEmailVerificationResult =
  | {
      ok: true;
      status: 200;
      message: string;
    }
  | {
      ok: false;
      status: 400 | 502;
      error: string;
    };

const genericResendMessage =
  "If an unverified account exists for that email, we'll send a verification link.";

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findUserByEmail(email: string) {
  const { prisma } = await import("../prisma");

  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      name: true,
      email: true,
      passwordHash: true,
      emailVerified: true,
    },
  });
}

function generateVerificationToken() {
  return randomBytes(32).toString("hex");
}

async function createVerificationToken(data: {
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

function createVerificationUrl(input: VerificationUrlInput, baseUrl?: string) {
  const url = new URL("/api/auth/verify-email", getAppBaseUrl(baseUrl));

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

function createVerificationEmailHtml(input: VerificationEmailInput) {
  const name = escapeHtml(input.name);
  const verificationUrl = escapeHtml(input.verificationUrl);

  return `<p>Hi ${name},</p><p>Click the link below to verify your DevStash email address.</p><p><a href="${verificationUrl}">Verify your email</a></p><p>If you did not create a DevStash account, you can ignore this email.</p>`;
}

function createVerificationEmailText(input: VerificationEmailInput) {
  return `Hi ${input.name},

Verify your DevStash email address:
${input.verificationUrl}

If you did not create a DevStash account, you can ignore this email.`;
}

async function sendVerificationEmail(input: VerificationEmailInput) {
  await sendResendEmail({
    to: input.to,
    subject: "Verify your DevStash email",
    html: createVerificationEmailHtml(input),
    text: createVerificationEmailText(input),
    idempotencyKey: `verify-email:${hashVerificationToken(
      input.verificationUrl,
    ).slice(0, 64)}`,
  });
}

export function createRequestEmailVerificationDeps(
  options: { baseUrl?: string } = {},
): RequestEmailVerificationDeps {
  return {
    findUserByEmail,
    generateVerificationToken,
    hashVerificationToken,
    createVerificationToken,
    createVerificationUrl: (input) => createVerificationUrl(input, options.baseUrl),
    sendVerificationEmail,
    emailVerificationEnabled: isEmailVerificationEnabled(),
    now: () => new Date(),
    verificationTokenTtlMs: 24 * 60 * 60 * 1_000,
  };
}

export async function requestEmailVerification(
  input: unknown,
  deps: RequestEmailVerificationDeps = createRequestEmailVerificationDeps(),
): Promise<RequestEmailVerificationResult> {
  const email =
    typeof input === "object" && input !== null
      ? getString((input as ResendVerificationInput).email)
      : null;

  if (!email) {
    return {
      ok: false,
      status: 400,
      error: "Enter a valid email address.",
    };
  }

  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      status: 400,
      error: "Enter a valid email address.",
    };
  }

  if (!deps.emailVerificationEnabled) {
    return {
      ok: true,
      status: 200,
      message: genericResendMessage,
    };
  }

  const user = await deps.findUserByEmail(normalizedEmail);

  if (!user?.email || !user.passwordHash || user.emailVerified) {
    return {
      ok: true,
      status: 200,
      message: genericResendMessage,
    };
  }

  const verificationToken = deps.generateVerificationToken();
  const hashedVerificationToken = deps.hashVerificationToken(verificationToken);
  const verificationUrl = deps.createVerificationUrl({
    email: normalizedEmail,
    token: verificationToken,
  });
  const expires = new Date(deps.now().getTime() + deps.verificationTokenTtlMs);

  await deps.createVerificationToken({
    identifier: normalizedEmail,
    token: hashedVerificationToken,
    expires,
  });

  try {
    await deps.sendVerificationEmail({
      to: normalizedEmail,
      name: user.name ?? normalizedEmail,
      verificationUrl,
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Unable to send verification email. Try again later.",
    };
  }

  return {
    ok: true,
    status: 200,
    message: genericResendMessage,
  };
}
