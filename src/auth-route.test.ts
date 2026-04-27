import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("NextAuth route handlers", () => {
  it("exports GET and POST handlers from the shared auth setup", async () => {
    const route = await import("./app/api/auth/[...nextauth]/route");

    assert.equal(typeof route.GET, "function");
    assert.equal(typeof route.POST, "function");
  });
});
