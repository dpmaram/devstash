import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  authorizeCredentials,
  type AuthorizeCredentialsDeps,
} from "./credentials";

function createAuthorizeCredentialsDeps(
  overrides: Partial<AuthorizeCredentialsDeps> = {},
): AuthorizeCredentialsDeps {
  return {
    findUserByEmail: async () => null,
    verifyPassword: async () => false,
    emailVerificationEnabled: true,
    ...overrides,
  };
}

describe("authorizeCredentials", () => {
  it("returns null when credentials are missing or malformed", async () => {
    let findCalls = 0;

    const user = await authorizeCredentials(
      { email: "ada@example.com" },
      createAuthorizeCredentialsDeps({
        findUserByEmail: async () => {
          findCalls += 1;
          return null;
        },
        verifyPassword: async () => true,
      }),
    );

    assert.equal(user, null);
    assert.equal(findCalls, 0);
  });

  it("normalizes email before looking up the user", async () => {
    let requestedEmail = "";

    await authorizeCredentials(
      { email: " ADA@Example.COM ", password: "password123" },
      createAuthorizeCredentialsDeps({
        findUserByEmail: async (email) => {
          requestedEmail = email;
          return null;
        },
        verifyPassword: async () => false,
      }),
    );

    assert.equal(requestedEmail, "ada@example.com");
  });

  it("returns null when the user has no password hash", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "password123" },
      createAuthorizeCredentialsDeps({
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: null,
          passwordHash: null,
          emailVerified: new Date("2026-04-27T19:00:00.000Z"),
        }),
        verifyPassword: async () => {
          throw new Error("verifyPassword should not be called");
        },
      }),
    );

    assert.equal(user, null);
  });

  it("returns null when password verification fails", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "wrong-password" },
      createAuthorizeCredentialsDeps({
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: null,
          passwordHash: "hashed-password",
          emailVerified: new Date("2026-04-27T19:00:00.000Z"),
        }),
        verifyPassword: async () => false,
      }),
    );

    assert.equal(user, null);
  });

  it("returns null when the email/password user has not verified their email", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "password123" },
      createAuthorizeCredentialsDeps({
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: null,
          passwordHash: "hashed-password",
          emailVerified: null,
        }),
        verifyPassword: async () => {
          throw new Error("verifyPassword should not be called");
        },
      }),
    );

    assert.equal(user, null);
  });

  it("allows an unverified email/password user when email verification is disabled", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "password123" },
      createAuthorizeCredentialsDeps({
        emailVerificationEnabled: false,
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: null,
          passwordHash: "hashed-password",
          emailVerified: null,
        }),
        verifyPassword: async (password, hash) =>
          password === "password123" && hash === "hashed-password",
      }),
    );

    assert.deepEqual(user, {
      id: "user_123",
      name: "Ada",
      email: "ada@example.com",
      image: null,
    });
  });

  it("returns the public auth user when the password is valid", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "password123" },
      createAuthorizeCredentialsDeps({
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: "https://example.com/ada.png",
          passwordHash: "hashed-password",
          emailVerified: new Date("2026-04-27T19:00:00.000Z"),
        }),
        verifyPassword: async (password, hash) =>
          password === "password123" && hash === "hashed-password",
      }),
    );

    assert.deepEqual(user, {
      id: "user_123",
      name: "Ada",
      email: "ada@example.com",
      image: "https://example.com/ada.png",
    });
  });
});
