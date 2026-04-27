import bcrypt from "bcryptjs";
import type { User } from "next-auth";

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
};

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
};

export async function authorizeCredentials(
  credentials: CredentialsInput,
  deps: AuthorizeCredentialsDeps = defaultDeps,
): Promise<User | null> {
  const parsedCredentials = parseCredentials(credentials);

  if (!parsedCredentials) {
    return null;
  }

  const user = await deps.findUserByEmail(parsedCredentials.email);

  if (!user?.passwordHash) {
    return null;
  }

  if (!user.emailVerified) {
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
