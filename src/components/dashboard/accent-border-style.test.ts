import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { getAccentBorderStyle } from "./accent-border-style";

describe("getAccentBorderStyle", () => {
  it("uses the accent color for the left border only", () => {
    assert.deepEqual(getAccentBorderStyle("#ec4899"), {
      borderLeftColor: "#ec4899",
    });
  });
});
