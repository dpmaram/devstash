import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verifyEmailToken, type VerifyEmailTokenDeps } from "./verification";

function createVerifyEmailTokenDeps(
  overrides: Partial<VerifyEmailTokenDeps> = {},
): VerifyEmailTokenDeps {
  return {
    hashVerificationToken: (token) => `hashed:${token}`,
    findVerificationToken: async () => null,
    markEmailVerified: async () => {},
    deleteVerificationToken: async () => {},
    deleteVerificationTokensForIdentifier: async () => {},
    now: () => new Date("2026-04-27T19:00:00.000Z"),
    ...overrides,
  };
}

describe("verifyEmailToken", () => {
  it("marks the matching email as verified and deletes used tokens", async () => {
    let verifiedEmail = "";
    let deletedToken = "";
    let deletedIdentifier = "";

    const result = await verifyEmailToken(
      {
        email: " ADA@Example.COM ",
        token: "raw-token",
      },
      createVerifyEmailTokenDeps({
        findVerificationToken: async (hashedToken) =>
          hashedToken === "hashed:raw-token"
            ? {
                identifier: "ada@example.com",
                token: hashedToken,
                expires: new Date("2026-04-27T20:00:00.000Z"),
              }
            : null,
        markEmailVerified: async (email) => {
          verifiedEmail = email;
        },
        deleteVerificationToken: async (token) => {
          deletedToken = token;
        },
        deleteVerificationTokensForIdentifier: async (identifier) => {
          deletedIdentifier = identifier;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: true,
      status: "success",
      email: "ada@example.com",
    });
    assert.equal(verifiedEmail, "ada@example.com");
    assert.equal(deletedToken, "hashed:raw-token");
    assert.equal(deletedIdentifier, "ada@example.com");
  });

  it("rejects a token for a different email", async () => {
    const result = await verifyEmailToken(
      {
        email: "ada@example.com",
        token: "raw-token",
      },
      createVerifyEmailTokenDeps({
        findVerificationToken: async (hashedToken) => ({
          identifier: "grace@example.com",
          token: hashedToken,
          expires: new Date("2026-04-27T20:00:00.000Z"),
        }),
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: "invalid",
      error: "Verification link is invalid.",
    });
  });

  it("deletes and rejects expired tokens", async () => {
    let deletedToken = "";

    const result = await verifyEmailToken(
      {
        email: "ada@example.com",
        token: "raw-token",
      },
      createVerifyEmailTokenDeps({
        findVerificationToken: async (hashedToken) => ({
          identifier: "ada@example.com",
          token: hashedToken,
          expires: new Date("2026-04-27T18:59:59.000Z"),
        }),
        deleteVerificationToken: async (token) => {
          deletedToken = token;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: "expired",
      error: "Verification link has expired.",
    });
    assert.equal(deletedToken, "hashed:raw-token");
  });
});
