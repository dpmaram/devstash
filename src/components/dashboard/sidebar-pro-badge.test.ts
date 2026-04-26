import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SIDEBAR_PRO_BADGE_LABEL,
  shouldShowSidebarProBadge,
} from "./sidebar-pro-badge";

describe("sidebar Pro badge", () => {
  it("marks file and image item types as Pro-only sidebar types", () => {
    assert.equal(shouldShowSidebarProBadge("file"), true);
    assert.equal(shouldShowSidebarProBadge("image"), true);
  });

  it("does not mark other item types as Pro-only sidebar types", () => {
    for (const slug of ["snippet", "prompt", "command", "note", "link"]) {
      assert.equal(shouldShowSidebarProBadge(slug), false);
    }
  });

  it("uses an uppercase Pro label", () => {
    assert.equal(SIDEBAR_PRO_BADGE_LABEL, "PRO");
  });
});
