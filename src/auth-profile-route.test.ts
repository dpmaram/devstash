import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("profile change password route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/profile/change-password/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/profile/change-password/route");

    const response = await POST(
      new Request("http://localhost/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "not-json",
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Request body must be valid JSON.",
    });
  });
});

describe("profile delete account route", () => {
  it("exports a DELETE handler", async () => {
    const route = await import("./app/api/profile/delete-account/route");

    assert.equal(typeof route.DELETE, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { DELETE } = await import("./app/api/profile/delete-account/route");

    const response = await DELETE(
      new Request("http://localhost/api/profile/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: "not-json",
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Request body must be valid JSON.",
    });
  });
});
