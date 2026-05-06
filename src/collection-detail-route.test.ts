import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("collection detail route", () => {
  it("exports a page component for collection slug links", async () => {
    const page = await import("./app/collections/[slug]/page");

    assert.equal(typeof page.default, "function");
  });
});
