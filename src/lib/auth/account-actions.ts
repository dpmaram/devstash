import bcrypt from "bcryptjs";

type ChangePasswordInput = {
  userId?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

type DeleteAccountInput = {
  userId?: unknown;
  confirmationEmail?: unknown;
};

type AccountActionUser = {
  id: string;
  email: string | null;
  passwordHash: string | null;
};

type DeleteAccountUser = {
  id: string;
  email: string | null;
};

export type ChangePasswordDeps = {
  findUserById: (userId: string) => Promise<AccountActionUser | null>;
  verifyPassword: (password: string, passwordHash: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
  updatePassword: (userId: string, passwordHash: string) => Promise<void>;
};

export type DeleteAccountDeps = {
  findUserById: (userId: string) => Promise<DeleteAccountUser | null>;
  deleteUser: (userId: string) => Promise<void>;
};

export type ChangePasswordResult =
  | {
      ok: true;
      status: 200;
      message: string;
    }
  | {
      ok: false;
      status: 400 | 403 | 404;
      error: string;
    };

export type DeleteAccountResult =
  | {
      ok: true;
      status: 200;
      message: string;
    }
  | {
      ok: false;
      status: 400 | 404;
      error: string;
    };

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isObjectRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function parseChangePasswordInput(input: unknown) {
  if (!isObjectRecord(input)) {
    return {
      ok: false,
      status: 400,
      error: "Current password, new password, and confirm password are required.",
    } as const;
  }

  const userId = getString(input.userId);
  const currentPassword = getString(input.currentPassword);
  const newPassword = getString(input.newPassword);
  const confirmPassword = getString(input.confirmPassword);

  if (!userId || !currentPassword || !newPassword || !confirmPassword) {
    return {
      ok: false,
      status: 400,
      error: "Current password, new password, and confirm password are required.",
    } as const;
  }

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      status: 400,
      error: "Passwords do not match.",
    } as const;
  }

  return {
    ok: true,
    value: {
      userId,
      currentPassword,
      newPassword,
    },
  } as const;
}

function parseDeleteAccountInput(input: unknown) {
  if (!isObjectRecord(input)) {
    return {
      ok: false,
      status: 400,
      error: "Type your account email to confirm deletion.",
    } as const;
  }

  const userId = getString(input.userId);
  const confirmationEmail = getString(input.confirmationEmail);

  if (!userId || !confirmationEmail) {
    return {
      ok: false,
      status: 400,
      error: "Type your account email to confirm deletion.",
    } as const;
  }

  return {
    ok: true,
    value: {
      userId,
      confirmationEmail: normalizeEmail(confirmationEmail),
    },
  } as const;
}

async function findChangePasswordUserById(userId: string) {
  const { prisma } = await import("../prisma");

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });
}

async function updatePassword(userId: string, passwordHash: string) {
  const { prisma } = await import("../prisma");

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });
}

async function findDeleteAccountUserById(userId: string) {
  const { prisma } = await import("../prisma");

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
    },
  });
}

async function deleteUser(userId: string) {
  const { prisma } = await import("../prisma");

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
}

export function createChangePasswordDeps() {
  return {
    findUserById: findChangePasswordUserById,
    verifyPassword: (password: string, passwordHash: string) =>
      bcrypt.compare(password, passwordHash),
    hashPassword: (password: string) => bcrypt.hash(password, 12),
    updatePassword,
  } satisfies ChangePasswordDeps;
}

export function createDeleteAccountDeps() {
  return {
    findUserById: findDeleteAccountUserById,
    deleteUser,
  } satisfies DeleteAccountDeps;
}

export async function changePassword(
  input: ChangePasswordInput,
  deps: ChangePasswordDeps = createChangePasswordDeps(),
): Promise<ChangePasswordResult> {
  const parsedInput = parseChangePasswordInput(input);

  if (!parsedInput.ok) {
    return parsedInput;
  }

  const user = await deps.findUserById(parsedInput.value.userId);

  if (!user) {
    return {
      ok: false,
      status: 404,
      error: "Account not found.",
    };
  }

  if (!user.passwordHash) {
    return {
      ok: false,
      status: 403,
      error: "Password changes are only available for email/password accounts.",
    };
  }

  const currentPasswordIsValid = await deps.verifyPassword(
    parsedInput.value.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordIsValid) {
    return {
      ok: false,
      status: 400,
      error: "Current password is incorrect.",
    };
  }

  const passwordHash = await deps.hashPassword(parsedInput.value.newPassword);

  await deps.updatePassword(parsedInput.value.userId, passwordHash);

  return {
    ok: true,
    status: 200,
    message: "Password updated.",
  };
}

export async function deleteAccount(
  input: DeleteAccountInput,
  deps: DeleteAccountDeps = createDeleteAccountDeps(),
): Promise<DeleteAccountResult> {
  const parsedInput = parseDeleteAccountInput(input);

  if (!parsedInput.ok) {
    return parsedInput;
  }

  const user = await deps.findUserById(parsedInput.value.userId);

  if (!user) {
    return {
      ok: false,
      status: 404,
      error: "Account not found.",
    };
  }

  if (!user.email || normalizeEmail(user.email) !== parsedInput.value.confirmationEmail) {
    return {
      ok: false,
      status: 400,
      error: "Type your account email to confirm deletion.",
    };
  }

  await deps.deleteUser(parsedInput.value.userId);

  return {
    ok: true,
    status: 200,
    message: "Account deleted.",
  };
}
