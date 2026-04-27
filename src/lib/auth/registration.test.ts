import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { registerUser } from "./registration";

describe("registerUser", () => {
  it("rejects missing registration fields", async () => {
    let createCalls = 0;

    const result = await registerUser(
      {
        email: "ada@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      {
        findUserByEmail: async () => null,
        hashPassword: async () => "hashed-password",
        createUser: async () => {
          createCalls += 1;
          throw new Error("createUser should not be called");
        },
      },
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
      {
        findUserByEmail: async () => null,
        hashPassword: async () => "hashed-password",
        createUser: async () => {
          throw new Error("createUser should not be called");
        },
      },
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
      {
        findUserByEmail: async (email) =>
          email === "ada@example.com" ? { id: "user_existing" } : null,
        hashPassword: async () => {
          hashCalls += 1;
          return "hashed-password";
        },
        createUser: async () => {
          throw new Error("createUser should not be called");
        },
      },
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

    const result = await registerUser(
      {
        name: " Ada Lovelace ",
        email: " ADA@Example.COM ",
        password: "password123",
        confirmPassword: "password123",
      },
      {
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
      },
    );

    assert.deepEqual(createdUser, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash: "hashed:password123",
    });
    assert.deepEqual(result, {
      ok: true,
      status: 201,
      user: {
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
    });
  });
});
