import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { registerUser, type RegisterUserDeps } from "./registration";

function createRegisterUserDeps(
  overrides: Partial<RegisterUserDeps> = {},
): RegisterUserDeps {
  return {
    findUserByEmail: async () => null,
    hashPassword: async (password) => `hashed:${password}`,
    createUser: async (data) => ({
      id: "user_123",
      name: data.name,
      email: data.email,
    }),
    generateVerificationToken: () => "raw-verification-token",
    hashVerificationToken: (token) => `hashed:${token}`,
    createVerificationToken: async () => {},
    createVerificationUrl: ({ email, token }) =>
      `https://devstash.test/api/auth/verify-email?email=${encodeURIComponent(
        email,
      )}&token=${encodeURIComponent(token)}`,
    sendVerificationEmail: async () => {},
    emailVerificationEnabled: true,
    now: () => new Date("2026-04-27T19:00:00.000Z"),
    verificationTokenTtlMs: 24 * 60 * 60 * 1000,
    ...overrides,
  };
}

describe("registerUser", () => {
  it("rejects missing registration fields", async () => {
    let createCalls = 0;

    const result = await registerUser(
      {
        email: "ada@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      createRegisterUserDeps({
        findUserByEmail: async () => null,
        hashPassword: async () => "hashed-password",
        createUser: async () => {
          createCalls += 1;
          throw new Error("createUser should not be called");
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "Name, email, password, and confirmPassword are required.",
    });
    assert.equal(createCalls, 0);
  });

  it("rejects mismatched passwords", async () => {
    const result = await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
        confirmPassword: "different-password",
      },
      createRegisterUserDeps({
        findUserByEmail: async () => null,
        hashPassword: async () => "hashed-password",
        createUser: async () => {
          throw new Error("createUser should not be called");
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "Passwords do not match.",
    });
  });

  it("rejects an existing user without hashing the password", async () => {
    let hashCalls = 0;

    const result = await registerUser(
      {
        name: "Ada",
        email: "ADA@Example.COM",
        password: "password123",
        confirmPassword: "password123",
      },
      createRegisterUserDeps({
        findUserByEmail: async (email) =>
          email === "ada@example.com" ? { id: "user_existing" } : null,
        hashPassword: async () => {
          hashCalls += 1;
          return "hashed-password";
        },
        createUser: async () => {
          throw new Error("createUser should not be called");
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 409,
      error: "A user with that email already exists.",
    });
    assert.equal(hashCalls, 0);
  });

  it("hashes the password and creates a normalized user", async () => {
    let createdUser:
      | {
          name: string;
          email: string;
          passwordHash: string;
        }
      | undefined;
    let createdVerificationToken:
      | {
          identifier: string;
          token: string;
          expires: Date;
        }
      | undefined;
    let sentVerificationEmail:
      | {
          to: string;
          name: string;
          verificationUrl: string;
        }
      | undefined;

    const result = await registerUser(
      {
        name: " Ada Lovelace ",
        email: " ADA@Example.COM ",
        password: "password123",
        confirmPassword: "password123",
      },
      createRegisterUserDeps({
        findUserByEmail: async () => null,
        hashPassword: async (password) => `hashed:${password}`,
        createUser: async (data) => {
          createdUser = data;

          return {
            id: "user_123",
            name: data.name,
            email: data.email,
          };
        },
        createVerificationToken: async (data) => {
          createdVerificationToken = data;
        },
        sendVerificationEmail: async (message) => {
          sentVerificationEmail = message;
        },
      }),
    );

    assert.deepEqual(createdUser, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash: "hashed:password123",
    });
    assert.deepEqual(createdVerificationToken, {
      identifier: "ada@example.com",
      token: "hashed:raw-verification-token",
      expires: new Date("2026-04-28T19:00:00.000Z"),
    });
    assert.deepEqual(sentVerificationEmail, {
      to: "ada@example.com",
      name: "Ada Lovelace",
      verificationUrl:
        "https://devstash.test/api/auth/verify-email?email=ada%40example.com&token=raw-verification-token",
    });
    assert.deepEqual(result, {
      ok: true,
      status: 201,
      user: {
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
      emailVerificationRequired: true,
    });
  });

  it("creates a verified user without sending email when email verification is disabled", async () => {
    let generatedVerificationTokens = 0;
    let createdVerificationTokens = 0;
    let sentVerificationEmails = 0;
    let createdUser:
      | {
          name: string;
          email: string;
          passwordHash: string;
          emailVerified?: Date;
        }
      | undefined;

    const result = await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      createRegisterUserDeps({
        emailVerificationEnabled: false,
        createUser: async (data) => {
          createdUser = data;

          return {
            id: "user_123",
            name: data.name,
            email: data.email,
          };
        },
        generateVerificationToken: () => {
          generatedVerificationTokens += 1;
          return "raw-verification-token";
        },
        createVerificationToken: async () => {
          createdVerificationTokens += 1;
        },
        sendVerificationEmail: async () => {
          sentVerificationEmails += 1;
        },
      }),
    );

    assert.deepEqual(createdUser, {
      name: "Ada",
      email: "ada@example.com",
      passwordHash: "hashed:password123",
      emailVerified: new Date("2026-04-27T19:00:00.000Z"),
    });
    assert.equal(generatedVerificationTokens, 0);
    assert.equal(createdVerificationTokens, 0);
    assert.equal(sentVerificationEmails, 0);
    assert.deepEqual(result, {
      ok: true,
      status: 201,
      user: {
        id: "user_123",
        name: "Ada",
        email: "ada@example.com",
      },
      emailVerificationRequired: false,
    });
  });

  it("returns an error without creating the user when verification email cannot be sent", async () => {
    let createCalls = 0;

    const result = await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      createRegisterUserDeps({
        createUser: async (data) => {
          createCalls += 1;

          return {
            id: "user_123",
            name: data.name,
            email: data.email,
          };
        },
        sendVerificationEmail: async () => {
          throw new Error("Resend failed");
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 502,
      error: "Unable to send verification email. Try again later.",
    });
    assert.equal(createCalls, 0);
  });
});
