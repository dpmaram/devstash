import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("custom auth pages", () => {
  it("exports a custom sign-in page", async () => {
    const page = await import("./app/sign-in/page");

    assert.equal(typeof page.default, "function");
    assert.equal(page.metadata.title, "Sign in | DevStash");
  });

  it("exports a custom register page", async () => {
    const page = await import("./app/register/page");

    assert.equal(typeof page.default, "function");
    assert.equal(page.metadata.title, "Create account | DevStash");
  });

  it("exports a profile page for the sidebar avatar link", async () => {
    const page = await import("./app/profile/page");

    assert.equal(typeof page.default, "function");
    assert.equal(page.metadata.title, "Profile | DevStash");
  });
});
