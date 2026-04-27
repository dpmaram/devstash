import assert from "node:assert/strict";
import { describe, it } from "node:test";

import authConfig, { shouldAllowGitHubEmailAccountLinking } from "./auth.config";

describe("auth config", () => {
  it("keeps the shared config edge-compatible for proxy usage", () => {
    assert.equal("adapter" in authConfig, false);
    assert.equal("callbacks" in authConfig, false);
    assert.equal("session" in authConfig, false);
    assert.equal("pages" in authConfig, false);
  });

  it("registers GitHub as the only phase-one provider", () => {
    assert.equal(authConfig.providers.length, 1);
    assert.equal(authConfig.providers[0]?.name, "GitHub");
  });

  it("only enables GitHub email account linking in development", () => {
    assert.equal(shouldAllowGitHubEmailAccountLinking("development"), true);
    assert.equal(shouldAllowGitHubEmailAccountLinking("production"), false);
    assert.equal(shouldAllowGitHubEmailAccountLinking("test"), false);
  });

  it("passes the environment-specific account linking setting to GitHub", () => {
    const provider = authConfig.providers[0];

    assert.equal(
      "options" in provider &&
        provider.options?.allowDangerousEmailAccountLinking,
      shouldAllowGitHubEmailAccountLinking(),
    );
  });
});
