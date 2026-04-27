import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("registration route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/register/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/register/route");

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
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
    const { POST } = await import("./app/api/auth/register/route");

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Ada",
          email: "ada@example.com",
          password: "password123",
          confirmPassword: "different-password",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Passwords do not match.",
    });
  });
});
