import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { isEmailVerificationEnabled } from "./email-verification";

describe("isEmailVerificationEnabled", () => {
  it("keeps email verification enabled when the env value is unset", () => {
    assert.equal(isEmailVerificationEnabled(undefined), true);
  });

  it("disables email verification for false-like env values", () => {
    assert.equal(isEmailVerificationEnabled("false"), false);
    assert.equal(isEmailVerificationEnabled(" 0 "), false);
    assert.equal(isEmailVerificationEnabled("OFF"), false);
  });

  it("keeps email verification enabled for any other env value", () => {
    assert.equal(isEmailVerificationEnabled("true"), true);
    assert.equal(isEmailVerificationEnabled("yes"), true);
  });
});
