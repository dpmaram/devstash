import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { attachSessionUserId, resolveAuthRedirect } from "./session";

describe("attachSessionUserId", () => {
  it("copies the JWT subject onto session.user.id", () => {
    const session = attachSessionUserId({
      session: {
        expires: "2026-05-01T00:00:00.000Z",
        user: {
          email: "ada@example.com",
          image: null,
          name: "Ada",
        },
      },
      token: {
        sub: "user_123",
      },
    });

    assert.ok(session.user);
    assert.equal(session.user.id, "user_123");
  });

  it("leaves the session unchanged when no user or subject is present", () => {
    const session = {
      expires: "2026-05-01T00:00:00.000Z",
      user: undefined,
    };

    assert.equal(
      attachSessionUserId({
        session,
        token: {},
      }),
      session,
    );
  });
});

describe("resolveAuthRedirect", () => {
  it("sends the default successful sign-in redirect to dashboard", () => {
    assert.equal(
      resolveAuthRedirect({
        url: "http://localhost:3000",
        baseUrl: "http://localhost:3000",
      }),
      "http://localhost:3000/dashboard",
    );
    assert.equal(
      resolveAuthRedirect({
        url: "http://localhost:3000/",
        baseUrl: "http://localhost:3000",
      }),
      "http://localhost:3000/dashboard",
    );
  });

  it("preserves explicit same-origin callback URLs", () => {
    assert.equal(
      resolveAuthRedirect({
        url: "http://localhost:3000/dashboard/collections",
        baseUrl: "http://localhost:3000",
      }),
      "http://localhost:3000/dashboard/collections",
    );
  });

  it("resolves relative callback URLs against the app origin", () => {
    assert.equal(
      resolveAuthRedirect({
        url: "/dashboard",
        baseUrl: "http://localhost:3000",
      }),
      "http://localhost:3000/dashboard",
    );
  });

  it("rejects off-origin callback URLs", () => {
    assert.equal(
      resolveAuthRedirect({
        url: "https://example.com/dashboard",
        baseUrl: "http://localhost:3000",
      }),
      "http://localhost:3000",
    );
  });

  it("falls back when callback URL parsing fails", () => {
    assert.equal(
      resolveAuthRedirect({
        url: "https://[invalid-url",
        baseUrl: "http://localhost:3000",
      }),
      "http://localhost:3000",
    );
  });
});
