import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { attachSessionUserId } from "./session";

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
