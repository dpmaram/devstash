import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("collections route", () => {
  it("exports a page component for the sidebar collections link", async () => {
    const page = await import("./app/collections/page");

    assert.equal(typeof page.default, "function");
  });
});
