import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { sendResendEmail } from "@/lib/email/resend";
import { isEmailVerificationEnabled } from "./email-verification";
import { hashVerificationToken } from "./verification";

type RegistrationInput = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

type RegisteredUser = {
  id: string;
  name: string | null;
  email: string | null;
};

type ExistingUser = {
  id: string;
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

export type RegisterUserDeps = {
  findUserByEmail: (email: string) => Promise<ExistingUser | null>;
  hashPassword: (password: string) => Promise<string>;
  createUser: (data: {
    name: string;
    email: string;
    passwordHash: string;
    emailVerified?: Date;
  }) => Promise<RegisteredUser>;
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

export type RegisterUserResult =
  | {
      ok: true;
      status: 201;
      user: RegisteredUser;
      emailVerificationRequired: boolean;
    }
  | {
      ok: false;
      status: 400 | 409 | 502;
      error: string;
    };

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isRegistrationInput(input: unknown): input is RegistrationInput {
  return typeof input === "object" && input !== null;
}

function parseRegistrationInput(input: unknown) {
  if (!isRegistrationInput(input)) {
    return {
      ok: false,
      status: 400,
      error: "Name, email, password, and confirmPassword are required.",
    } as const;
  }

  const name = getString(input.name)?.trim();
  const email = getString(input.email);
  const password = getString(input.password);
  const confirmPassword = getString(input.confirmPassword);

  if (!name || !email || !password || !confirmPassword) {
    return {
      ok: false,
      status: 400,
      error: "Name, email, password, and confirmPassword are required.",
    } as const;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      ok: false,
      status: 400,
      error: "Name, email, password, and confirmPassword are required.",
    } as const;
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      status: 400,
      error: "Passwords do not match.",
    } as const;
  }

  return {
    ok: true,
    value: {
      name,
      email: normalizedEmail,
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
    },
  });
}

async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  emailVerified?: Date;
}) {
  const { prisma } = await import("../prisma");

  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
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

export function createRegisterUserDeps(options: { baseUrl?: string } = {}) {
  return {
    findUserByEmail,
    hashPassword: (password: string) => bcrypt.hash(password, 12),
    createUser,
    generateVerificationToken,
    hashVerificationToken,
    createVerificationToken,
    createVerificationUrl: (input: VerificationUrlInput) =>
      createVerificationUrl(input, options.baseUrl),
    sendVerificationEmail,
    emailVerificationEnabled: isEmailVerificationEnabled(),
    now: () => new Date(),
    verificationTokenTtlMs: 24 * 60 * 60 * 1000,
  } satisfies RegisterUserDeps;
}

export async function registerUser(
  input: unknown,
  deps: RegisterUserDeps = createRegisterUserDeps(),
): Promise<RegisterUserResult> {
  const parsedInput = parseRegistrationInput(input);

  if (!parsedInput.ok) {
    return parsedInput;
  }

  const existingUser = await deps.findUserByEmail(parsedInput.value.email);

  if (existingUser) {
    return {
      ok: false,
      status: 409,
      error: "A user with that email already exists.",
    };
  }

  const passwordHash = await deps.hashPassword(parsedInput.value.password);

  if (!deps.emailVerificationEnabled) {
    const user = await deps.createUser({
      name: parsedInput.value.name,
      email: parsedInput.value.email,
      passwordHash,
      emailVerified: deps.now(),
    });

    return {
      ok: true,
      status: 201,
      user,
      emailVerificationRequired: false,
    };
  }

  const verificationToken = deps.generateVerificationToken();
  const hashedVerificationToken = deps.hashVerificationToken(verificationToken);
  const verificationUrl = deps.createVerificationUrl({
    email: parsedInput.value.email,
    token: verificationToken,
  });
  const expires = new Date(deps.now().getTime() + deps.verificationTokenTtlMs);

  try {
    await deps.sendVerificationEmail({
      to: parsedInput.value.email,
      name: parsedInput.value.name,
      verificationUrl,
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Unable to send verification email. Try again later.",
    };
  }

  const user = await deps.createUser({
    name: parsedInput.value.name,
    email: parsedInput.value.email,
    passwordHash,
  });
  await deps.createVerificationToken({
    identifier: parsedInput.value.email,
    token: hashedVerificationToken,
    expires,
  });

  return {
    ok: true,
    status: 201,
    user,
    emailVerificationRequired: true,
  };
}
