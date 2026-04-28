import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  changePassword,
  deleteAccount,
  type ChangePasswordDeps,
  type DeleteAccountDeps,
} from "./account-actions";

function createChangePasswordDeps(
  overrides: Partial<ChangePasswordDeps> = {},
): ChangePasswordDeps {
  return {
    findUserById: async () => ({
      id: "user_123",
      email: "ada@example.com",
      passwordHash: "old-password-hash",
    }),
    verifyPassword: async (password, passwordHash) =>
      password === "old-password" && passwordHash === "old-password-hash",
    hashPassword: async (password) => `hashed:${password}`,
    updatePassword: async () => {},
    ...overrides,
  };
}

function createDeleteAccountDeps(
  overrides: Partial<DeleteAccountDeps> = {},
): DeleteAccountDeps {
  return {
    findUserById: async () => ({
      id: "user_123",
      email: "ada@example.com",
    }),
    deleteUser: async () => {},
    ...overrides,
  };
}

describe("changePassword", () => {
  it("updates the password for credentials users after verifying the current password", async () => {
    let updatedPassword:
      | {
          userId: string;
          passwordHash: string;
        }
      | undefined;

    const result = await changePassword(
      {
        userId: "user_123",
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "new-password",
      },
      createChangePasswordDeps({
        updatePassword: async (userId, passwordHash) => {
          updatedPassword = {
            userId,
            passwordHash,
          };
        },
      }),
    );

    assert.deepEqual(updatedPassword, {
      userId: "user_123",
      passwordHash: "hashed:new-password",
    });
    assert.deepEqual(result, {
      ok: true,
      status: 200,
      message: "Password updated.",
    });
  });

  it("rejects OAuth-only users without checking a password", async () => {
    let verifyCalls = 0;

    const result = await changePassword(
      {
        userId: "user_123",
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "new-password",
      },
      createChangePasswordDeps({
        findUserById: async () => ({
          id: "user_123",
          email: "ada@example.com",
          passwordHash: null,
        }),
        verifyPassword: async () => {
          verifyCalls += 1;
          return true;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "Password changes are only available for email/password accounts.",
    });
    assert.equal(verifyCalls, 0);
  });

  it("rejects an incorrect current password before hashing the new password", async () => {
    let hashCalls = 0;

    const result = await changePassword(
      {
        userId: "user_123",
        currentPassword: "wrong-password",
        newPassword: "new-password",
        confirmPassword: "new-password",
      },
      createChangePasswordDeps({
        verifyPassword: async () => false,
        hashPassword: async () => {
          hashCalls += 1;
          return "new-password-hash";
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "Current password is incorrect.",
    });
    assert.equal(hashCalls, 0);
  });
});

describe("deleteAccount", () => {
  it("deletes the current account after matching the confirmation email", async () => {
    let deletedUserId = "";

    const result = await deleteAccount(
      {
        userId: "user_123",
        confirmationEmail: " ADA@Example.COM ",
      },
      createDeleteAccountDeps({
        deleteUser: async (userId) => {
          deletedUserId = userId;
        },
      }),
    );

    assert.equal(deletedUserId, "user_123");
    assert.deepEqual(result, {
      ok: true,
      status: 200,
      message: "Account deleted.",
    });
  });

  it("rejects account deletion when the confirmation email does not match", async () => {
    let deleteCalls = 0;

    const result = await deleteAccount(
      {
        userId: "user_123",
        confirmationEmail: "wrong@example.com",
      },
      createDeleteAccountDeps({
        deleteUser: async () => {
          deleteCalls += 1;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "Type your account email to confirm deletion.",
    });
    assert.equal(deleteCalls, 0);
  });
});
