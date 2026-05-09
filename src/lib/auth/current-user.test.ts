import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { CurrentUser } from "@/lib/mock-data";

import { toCurrentUser } from "./current-user";

const fallbackUser: CurrentUser = {
  id: "fallback_user",
  name: "Fallback User",
  email: "fallback@example.com",
  avatarUrl: null,
  planTier: "pro",
};

describe("toCurrentUser", () => {
  it("uses Auth.js session details for the dashboard sidebar user", () => {
    assert.deepEqual(
      toCurrentUser(
        {
          id: "user_123",
          name: "Ada Lovelace",
          email: "ada@example.com",
          image: "https://example.com/ada.png",
        },
        fallbackUser,
      ),
      {
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        avatarUrl: "https://example.com/ada.png",
        planTier: "pro",
      },
    );
  });

  it("falls back to the email as the display name when no session name exists", () => {
    assert.deepEqual(
      toCurrentUser(
        {
          id: "user_123",
          name: null,
          email: "ada@example.com",
          image: null,
        },
        fallbackUser,
      ),
      {
        id: "user_123",
        name: "ada@example.com",
        email: "ada@example.com",
        avatarUrl: null,
        planTier: "pro",
      },
    );
  });

  it("maps FREE session tier to a free current user plan", () => {
    assert.equal(
      toCurrentUser(
        {
          id: "user_123",
          name: "Ada Lovelace",
          email: "ada@example.com",
          image: null,
          planTier: "FREE",
        },
        fallbackUser,
      ).planTier,
      "free",
    );
  });

  it("maps PRO session tier to a pro current user plan", () => {
    assert.equal(
      toCurrentUser(
        {
          id: "user_123",
          name: "Ada Lovelace",
          email: "ada@example.com",
          image: null,
          planTier: "PRO",
        },
        {
          ...fallbackUser,
          planTier: "free",
        },
      ).planTier,
      "pro",
    );
  });
});
