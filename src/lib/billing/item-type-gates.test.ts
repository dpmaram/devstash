import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { shouldRequireProForItemType } from "./item-type-gates";

describe("shouldRequireProForItemType", () => {
  it("requires Pro for file and image pages", () => {
    assert.equal(shouldRequireProForItemType("file", false), true);
    assert.equal(shouldRequireProForItemType("image", false), true);
  });

  it("does not require Pro for other item types", () => {
    assert.equal(shouldRequireProForItemType("snippet", false), false);
    assert.equal(shouldRequireProForItemType("prompt", false), false);
    assert.equal(shouldRequireProForItemType("command", false), false);
    assert.equal(shouldRequireProForItemType("note", false), false);
    assert.equal(shouldRequireProForItemType("link", false), false);
  });

  it("does not require Pro when user is already Pro", () => {
    assert.equal(shouldRequireProForItemType("file", true), false);
    assert.equal(shouldRequireProForItemType("image", true), false);
  });
});
