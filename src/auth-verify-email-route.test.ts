import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("email verification route", () => {
  it("exports a GET handler", async () => {
    const route = await import("./app/api/auth/verify-email/route");

    assert.equal(typeof route.GET, "function");
  });

  it("redirects invalid verification requests to sign in with a status", async () => {
    const { GET } = await import("./app/api/auth/verify-email/route");

    const response = await GET(
      new Request("http://localhost/api/auth/verify-email", {
        method: "GET",
      }),
    );

    assert.equal(response.status, 303);
    assert.equal(
      response.headers.get("location"),
      "http://localhost/sign-in?emailVerification=invalid",
    );
  });
});
