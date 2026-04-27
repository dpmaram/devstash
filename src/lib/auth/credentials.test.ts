import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authorizeCredentials } from "./credentials";

describe("authorizeCredentials", () => {
  it("returns null when credentials are missing or malformed", async () => {
    let findCalls = 0;

    const user = await authorizeCredentials(
      { email: "ada@example.com" },
      {
        findUserByEmail: async () => {
          findCalls += 1;
          return null;
        },
        verifyPassword: async () => true,
      },
    );

    assert.equal(user, null);
    assert.equal(findCalls, 0);
  });

  it("normalizes email before looking up the user", async () => {
    let requestedEmail = "";

    await authorizeCredentials(
      { email: " ADA@Example.COM ", password: "password123" },
      {
        findUserByEmail: async (email) => {
          requestedEmail = email;
          return null;
        },
        verifyPassword: async () => false,
      },
    );

    assert.equal(requestedEmail, "ada@example.com");
  });

  it("returns null when the user has no password hash", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "password123" },
      {
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: null,
          passwordHash: null,
        }),
        verifyPassword: async () => {
          throw new Error("verifyPassword should not be called");
        },
      },
    );

    assert.equal(user, null);
  });

  it("returns null when password verification fails", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "wrong-password" },
      {
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: null,
          passwordHash: "hashed-password",
        }),
        verifyPassword: async () => false,
      },
    );

    assert.equal(user, null);
  });

  it("returns the public auth user when the password is valid", async () => {
    const user = await authorizeCredentials(
      { email: "ada@example.com", password: "password123" },
      {
        findUserByEmail: async () => ({
          id: "user_123",
          name: "Ada",
          email: "ada@example.com",
          image: "https://example.com/ada.png",
          passwordHash: "hashed-password",
        }),
        verifyPassword: async (password, hash) =>
          password === "password123" && hash === "hashed-password",
      },
    );

    assert.deepEqual(user, {
      id: "user_123",
      name: "Ada",
      email: "ada@example.com",
      image: "https://example.com/ada.png",
    });
  });
});
