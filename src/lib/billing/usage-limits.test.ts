import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  FREE_PLAN_COLLECTION_LIMIT,
  FREE_PLAN_ITEM_LIMIT,
  canCreateCollection,
  canCreateItem,
  canUseAiFeatures,
  canUseUploads,
  normalizePlanTier,
} from "./usage-limits";

describe("canCreateItem", () => {
  it("allows Free plan item creation below the limit", () => {
    assert.deepEqual(
      canCreateItem({
        planTier: "FREE",
        currentItemCount: FREE_PLAN_ITEM_LIMIT - 1,
      }),
      {
        allowed: true,
        reason: "within_free_limit",
        currentCount: FREE_PLAN_ITEM_LIMIT - 1,
        maxAllowed: FREE_PLAN_ITEM_LIMIT,
      },
    );
  });

  it("blocks Free plan item creation at the limit", () => {
    assert.deepEqual(
      canCreateItem({
        planTier: "FREE",
        currentItemCount: FREE_PLAN_ITEM_LIMIT,
      }),
      {
        allowed: false,
        reason: "free_item_limit_reached",
        currentCount: FREE_PLAN_ITEM_LIMIT,
        maxAllowed: FREE_PLAN_ITEM_LIMIT,
      },
    );
  });

  it("allows unlimited item creation on Pro", () => {
    assert.deepEqual(
      canCreateItem({
        planTier: "PRO",
        currentItemCount: 10_000,
      }),
      {
        allowed: true,
        reason: "pro_unlimited",
        currentCount: 10_000,
        maxAllowed: null,
      },
    );
  });
});

describe("canCreateCollection", () => {
  it("allows Free plan collection creation below the limit", () => {
    assert.deepEqual(
      canCreateCollection({
        planTier: "FREE",
        currentCollectionCount: FREE_PLAN_COLLECTION_LIMIT - 1,
      }),
      {
        allowed: true,
        reason: "within_free_limit",
        currentCount: FREE_PLAN_COLLECTION_LIMIT - 1,
        maxAllowed: FREE_PLAN_COLLECTION_LIMIT,
      },
    );
  });

  it("blocks Free plan collection creation at the limit", () => {
    assert.deepEqual(
      canCreateCollection({
        planTier: "FREE",
        currentCollectionCount: FREE_PLAN_COLLECTION_LIMIT,
      }),
      {
        allowed: false,
        reason: "free_collection_limit_reached",
        currentCount: FREE_PLAN_COLLECTION_LIMIT,
        maxAllowed: FREE_PLAN_COLLECTION_LIMIT,
      },
    );
  });

  it("allows unlimited collection creation on Pro", () => {
    assert.deepEqual(
      canCreateCollection({
        planTier: "PRO",
        currentCollectionCount: 10_000,
      }),
      {
        allowed: true,
        reason: "pro_unlimited",
        currentCount: 10_000,
        maxAllowed: null,
      },
    );
  });
});

describe("feature eligibility", () => {
  it("disables uploads and AI features on Free", () => {
    assert.deepEqual(canUseUploads("FREE"), {
      allowed: false,
      reason: "free_uploads_unavailable",
    });

    assert.deepEqual(canUseAiFeatures("FREE"), {
      allowed: false,
      reason: "free_ai_features_unavailable",
    });
  });

  it("enables uploads and AI features on Pro", () => {
    assert.deepEqual(canUseUploads("PRO"), {
      allowed: true,
      reason: "pro_uploads_allowed",
    });

    assert.deepEqual(canUseAiFeatures("PRO"), {
      allowed: true,
      reason: "pro_ai_features_allowed",
    });
  });
});

describe("normalizePlanTier", () => {
  it("normalizes valid values and falls back safely for unexpected values", () => {
    assert.equal(normalizePlanTier("pro"), "PRO");
    assert.equal(normalizePlanTier(" FREE "), "FREE");
    assert.equal(normalizePlanTier("enterprise"), "FREE");
    assert.equal(normalizePlanTier(null), "FREE");
    assert.equal(normalizePlanTier(undefined), "FREE");
  });
});
