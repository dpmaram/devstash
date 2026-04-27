import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";

async function loadProxy() {
  process.env.AUTH_SECRET ??= "test-secret";
  return import("./proxy");
}

describe("proxy", () => {
  it("exports a named proxy function for Next.js 16", async () => {
    const { proxy } = await loadProxy();

    assert.equal(typeof proxy, "function");
  });

  it("only protects dashboard routes", async () => {
    const { config } = await loadProxy();

    assert.deepEqual(config.matcher, ["/dashboard/:path*"]);
  });

  it("redirects unauthenticated dashboard requests to the default sign-in page", async () => {
    const { proxy } = await loadProxy();
    const context: Parameters<typeof proxy>[1] = {
      params: Promise.resolve({}),
    };
    const response = await proxy(
      new NextRequest("http://localhost:3000/dashboard"),
      context,
    );

    assert.ok(response);
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "http://localhost:3000/api/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard",
    );
  });
});
