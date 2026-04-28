import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("normalizeItemTypeRouteSlug", () => {
  it("normalizes plural item type route slugs", async () => {
    const { normalizeItemTypeRouteSlug } = await import("./items");

    assert.equal(normalizeItemTypeRouteSlug("snippets"), "snippet");
    assert.equal(normalizeItemTypeRouteSlug("prompts"), "prompt");
    assert.equal(normalizeItemTypeRouteSlug("commands"), "command");
    assert.equal(normalizeItemTypeRouteSlug("notes"), "note");
    assert.equal(normalizeItemTypeRouteSlug("files"), "file");
    assert.equal(normalizeItemTypeRouteSlug("images"), "image");
    assert.equal(normalizeItemTypeRouteSlug("links"), "link");
  });
});
