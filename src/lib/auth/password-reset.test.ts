import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getPasswordResetIdentifier,
  requestPasswordReset,
  resetPassword,
  type RequestPasswordResetDeps,
  type ResetPasswordDeps,
} from "./password-reset";

function createRequestPasswordResetDeps(
  overrides: Partial<RequestPasswordResetDeps> = {},
): RequestPasswordResetDeps {
  return {
    findUserByEmail: async () => null,
    generateResetToken: () => "raw-reset-token",
    hashResetToken: (token) => `hashed:${token}`,
    createResetToken: async () => {},
    createResetUrl: ({ email, token }) =>
      `https://devstash.test/reset-password?email=${encodeURIComponent(
        email,
      )}&token=${encodeURIComponent(token)}`,
    sendResetEmail: async () => {},
    now: () => new Date("2026-04-27T23:00:00.000Z"),
    resetTokenTtlMs: 60 * 60 * 1000,
    ...overrides,
  };
}

function createResetPasswordDeps(
  overrides: Partial<ResetPasswordDeps> = {},
): ResetPasswordDeps {
  return {
    hashResetToken: (token) => `hashed:${token}`,
    findResetToken: async () => null,
    hashPassword: async (password) => `password-hash:${password}`,
    updateUserPassword: async () => {},
    deleteResetToken: async () => {},
    deleteResetTokensForIdentifier: async () => {},
    now: () => new Date("2026-04-27T23:00:00.000Z"),
    ...overrides,
  };
}

describe("getPasswordResetIdentifier", () => {
  it("namespaces reset tokens away from email verification tokens", () => {
    assert.equal(
      getPasswordResetIdentifier("Ada@Example.COM"),
      "password-reset:ada@example.com",
    );
  });
});

describe("requestPasswordReset", () => {
  it("rejects malformed email input", async () => {
    const result = await requestPasswordReset(
      {
        email: "not-an-email",
      },
      createRequestPasswordResetDeps(),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "Enter a valid email address.",
    });
  });

  it("returns the generic success response without creating a token for unknown accounts", async () => {
    let createdTokens = 0;
    let sentEmails = 0;

    const result = await requestPasswordReset(
      {
        email: "ada@example.com",
      },
      createRequestPasswordResetDeps({
        createResetToken: async () => {
          createdTokens += 1;
        },
        sendResetEmail: async () => {
          sentEmails += 1;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: true,
      status: 200,
      message:
        "If an account exists for that email, we'll send password reset instructions.",
    });
    assert.equal(createdTokens, 0);
    assert.equal(sentEmails, 0);
  });

  it("returns the generic success response without sending email for OAuth-only accounts", async () => {
    let createdTokens = 0;
    let sentEmails = 0;

    const result = await requestPasswordReset(
      {
        email: "ada@example.com",
      },
      createRequestPasswordResetDeps({
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          passwordHash: null,
        }),
        createResetToken: async () => {
          createdTokens += 1;
        },
        sendResetEmail: async () => {
          sentEmails += 1;
        },
      }),
    );

    assert.equal(result.ok, true);
    assert.equal(createdTokens, 0);
    assert.equal(sentEmails, 0);
  });

  it("creates a hashed single-use token and sends a reset email for credentials accounts", async () => {
    let createdToken:
      | {
          identifier: string;
          token: string;
          expires: Date;
        }
      | undefined;
    let sentEmail:
      | {
          to: string;
          name: string;
          resetUrl: string;
        }
      | undefined;

    const result = await requestPasswordReset(
      {
        email: " ADA@Example.COM ",
      },
      createRequestPasswordResetDeps({
        findUserByEmail: async (email) =>
          email === "ada@example.com"
            ? {
                id: "user_123",
                name: "Ada",
                email: "ada@example.com",
                passwordHash: "old-password-hash",
              }
            : null,
        createResetToken: async (token) => {
          createdToken = token;
        },
        sendResetEmail: async (message) => {
          sentEmail = message;
        },
      }),
    );

    assert.deepEqual(createdToken, {
      identifier: "password-reset:ada@example.com",
      token: "hashed:raw-reset-token",
      expires: new Date("2026-04-28T00:00:00.000Z"),
    });
    assert.deepEqual(sentEmail, {
      to: "ada@example.com",
      name: "Ada",
      resetUrl:
        "https://devstash.test/reset-password?email=ada%40example.com&token=raw-reset-token",
    });
    assert.deepEqual(result, {
      ok: true,
      status: 200,
      message:
        "If an account exists for that email, we'll send password reset instructions.",
    });
  });
});

describe("resetPassword", () => {
  it("rejects mismatched passwords before looking up the token", async () => {
    let findCalls = 0;

    const result = await resetPassword(
      {
        email: "ada@example.com",
        token: "raw-reset-token",
        password: "new-password",
        confirmPassword: "different-password",
      },
      createResetPasswordDeps({
        findResetToken: async () => {
          findCalls += 1;
          return null;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      resetStatus: "invalid",
      error: "Passwords do not match.",
    });
    assert.equal(findCalls, 0);
  });

  it("rejects invalid reset links", async () => {
    const result = await resetPassword(
      {
        email: "ada@example.com",
        token: "raw-reset-token",
        password: "new-password",
        confirmPassword: "new-password",
      },
      createResetPasswordDeps(),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      resetStatus: "invalid",
      error: "Password reset link is invalid.",
    });
  });

  it("deletes and rejects expired reset links", async () => {
    let deletedToken = "";
    let updateCalls = 0;

    const result = await resetPassword(
      {
        email: "ada@example.com",
        token: "raw-reset-token",
        password: "new-password",
        confirmPassword: "new-password",
      },
      createResetPasswordDeps({
        findResetToken: async () => ({
          identifier: "password-reset:ada@example.com",
          token: "hashed:raw-reset-token",
          expires: new Date("2026-04-27T22:59:59.000Z"),
        }),
        deleteResetToken: async (token) => {
          deletedToken = token;
        },
        updateUserPassword: async () => {
          updateCalls += 1;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      resetStatus: "expired",
      error: "Password reset link has expired.",
    });
    assert.equal(deletedToken, "hashed:raw-reset-token");
    assert.equal(updateCalls, 0);
  });

  it("updates the password and deletes reset tokens for a valid reset link", async () => {
    let updatedPassword:
      | {
          email: string;
          passwordHash: string;
        }
      | undefined;
    let deletedToken = "";
    let deletedIdentifier = "";

    const result = await resetPassword(
      {
        email: " ADA@Example.COM ",
        token: "raw-reset-token",
        password: "new-password",
        confirmPassword: "new-password",
      },
      createResetPasswordDeps({
        findResetToken: async (hashedToken) =>
          hashedToken === "hashed:raw-reset-token"
            ? {
                identifier: "password-reset:ada@example.com",
                token: "hashed:raw-reset-token",
                expires: new Date("2026-04-28T00:00:00.000Z"),
              }
            : null,
        updateUserPassword: async (email, passwordHash) => {
          updatedPassword = {
            email,
            passwordHash,
          };
        },
        deleteResetToken: async (token) => {
          deletedToken = token;
        },
        deleteResetTokensForIdentifier: async (identifier) => {
          deletedIdentifier = identifier;
        },
      }),
    );

    assert.deepEqual(updatedPassword, {
      email: "ada@example.com",
      passwordHash: "password-hash:new-password",
    });
    assert.equal(deletedToken, "hashed:raw-reset-token");
    assert.equal(deletedIdentifier, "password-reset:ada@example.com");
    assert.deepEqual(result, {
      ok: true,
      status: 200,
      resetStatus: "success",
      message: "Password reset. You can now sign in.",
    });
  });
});
