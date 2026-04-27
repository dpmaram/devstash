import bcrypt from "bcryptjs";

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

export type RegisterUserDeps = {
  findUserByEmail: (email: string) => Promise<ExistingUser | null>;
  hashPassword: (password: string) => Promise<string>;
  createUser: (data: {
    name: string;
    email: string;
    passwordHash: string;
  }) => Promise<RegisteredUser>;
};

export type RegisterUserResult =
  | {
      ok: true;
      status: 201;
      user: RegisteredUser;
    }
  | {
      ok: false;
      status: 400 | 409;
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

const defaultDeps: RegisterUserDeps = {
  findUserByEmail,
  hashPassword: (password) => bcrypt.hash(password, 12),
  createUser,
};

export async function registerUser(
  input: unknown,
  deps: RegisterUserDeps = defaultDeps,
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
  const user = await deps.createUser({
    name: parsedInput.value.name,
    email: parsedInput.value.email,
    passwordHash,
  });

  return {
    ok: true,
    status: 201,
    user,
  };
}
