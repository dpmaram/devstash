import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("forgot password route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/forgot-password/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/forgot-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "not-json",
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Request body must be valid JSON.",
    });
  });

  it("returns a 400 response for malformed email input", async () => {
    const { POST } = await import("./app/api/auth/forgot-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "bad-email",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Enter a valid email address.",
    });
  });
});

describe("reset password route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/reset-password/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/reset-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "not-json",
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Request body must be valid JSON.",
    });
  });

  it("returns a 400 response for mismatched passwords", async () => {
    const { POST } = await import("./app/api/auth/reset-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ada@example.com",
          token: "raw-reset-token",
          password: "new-password",
          confirmPassword: "different-password",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      resetStatus: "invalid",
      error: "Passwords do not match.",
    });
  });
});
