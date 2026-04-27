import assert from "node:assert/strict";
import { describe, it } from "node:test";

import authConfig, { shouldAllowGitHubEmailAccountLinking } from "./auth.config";

type RawCredentialsProvider = {
  options?: {
    credentials?: {
      email: {
        type?: string;
      };
      password: {
        type?: string;
      };
    };
  };
};

describe("auth config", () => {
  it("keeps the shared config edge-compatible for proxy usage", () => {
    assert.equal("adapter" in authConfig, false);
    assert.equal("callbacks" in authConfig, false);
    assert.equal("session" in authConfig, false);
  });

  it("uses the custom sign-in page", () => {
    assert.equal(authConfig.pages?.signIn, "/sign-in");
  });

  it("registers GitHub and Credentials providers", () => {
    assert.equal(authConfig.providers.length, 2);
    assert.equal(authConfig.providers[0]?.name, "GitHub");
    assert.equal(authConfig.providers[1]?.name, "Credentials");
  });

  it("keeps Credentials provider authorization as a shared-config placeholder", async () => {
    const provider = authConfig.providers[1];
    const providerWithOptions = provider as RawCredentialsProvider;

    assert.equal(provider?.id, "credentials");
    assert.equal(provider?.type, "credentials");
    assert.equal(providerWithOptions.options?.credentials?.email.type, "email");
    assert.equal(
      providerWithOptions.options?.credentials?.password.type,
      "password",
    );
    assert.equal(
      "authorize" in provider &&
        (await provider.authorize(
          { email: "ada@example.com", password: "password123" },
          new Request("http://localhost/api/auth/callback/credentials"),
        )),
      null,
    );
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
