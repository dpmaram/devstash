import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getUserInitials } from "./user-avatar";

describe("getUserInitials", () => {
  it("uses the first letter from each word in the display name", () => {
    assert.equal(getUserInitials("Brad Traversy"), "BT");
  });

  it("falls back to the first email character when the name is missing", () => {
    assert.equal(getUserInitials(null, "ada@example.com"), "A");
  });
});
