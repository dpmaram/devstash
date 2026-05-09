export type BillingPlanTier = "FREE" | "PRO";

export const FREE_PLAN_ITEM_LIMIT = 50;
export const FREE_PLAN_COLLECTION_LIMIT = 3;

export type UsageDecision = {
  allowed: boolean;
  reason:
    | "within_free_limit"
    | "free_item_limit_reached"
    | "free_collection_limit_reached"
    | "pro_unlimited";
  currentCount: number;
  maxAllowed: number | null;
};

export type FeatureEligibilityDecision = {
  allowed: boolean;
  reason:
    | "pro_uploads_allowed"
    | "free_uploads_unavailable"
    | "pro_ai_features_allowed"
    | "free_ai_features_unavailable";
};

export function normalizePlanTier(planTier: unknown): BillingPlanTier {
  if (typeof planTier !== "string") {
    return "FREE";
  }

  const normalizedPlanTier = planTier.trim().toUpperCase();

  if (normalizedPlanTier === "PRO") {
    return "PRO";
  }

  return "FREE";
}

export function canCreateItem(input: {
  planTier: unknown;
  currentItemCount: number;
}): UsageDecision {
  const normalizedPlanTier = normalizePlanTier(input.planTier);

  if (normalizedPlanTier === "PRO") {
    return {
      allowed: true,
      reason: "pro_unlimited",
      currentCount: input.currentItemCount,
      maxAllowed: null,
    };
  }

  const allowed = input.currentItemCount < FREE_PLAN_ITEM_LIMIT;

  return {
    allowed,
    reason: allowed ? "within_free_limit" : "free_item_limit_reached",
    currentCount: input.currentItemCount,
    maxAllowed: FREE_PLAN_ITEM_LIMIT,
  };
}

export function canCreateCollection(input: {
  planTier: unknown;
  currentCollectionCount: number;
}): UsageDecision {
  const normalizedPlanTier = normalizePlanTier(input.planTier);

  if (normalizedPlanTier === "PRO") {
    return {
      allowed: true,
      reason: "pro_unlimited",
      currentCount: input.currentCollectionCount,
      maxAllowed: null,
    };
  }

  const allowed = input.currentCollectionCount < FREE_PLAN_COLLECTION_LIMIT;

  return {
    allowed,
    reason: allowed ? "within_free_limit" : "free_collection_limit_reached",
    currentCount: input.currentCollectionCount,
    maxAllowed: FREE_PLAN_COLLECTION_LIMIT,
  };
}

export function canUseUploads(planTier: unknown): FeatureEligibilityDecision {
  const normalizedPlanTier = normalizePlanTier(planTier);

  if (normalizedPlanTier === "PRO") {
    return {
      allowed: true,
      reason: "pro_uploads_allowed",
    };
  }

  return {
    allowed: false,
    reason: "free_uploads_unavailable",
  };
}

export function canUseAiFeatures(
  planTier: unknown,
): FeatureEligibilityDecision {
  const normalizedPlanTier = normalizePlanTier(planTier);

  if (normalizedPlanTier === "PRO") {
    return {
      allowed: true,
      reason: "pro_ai_features_allowed",
    };
  }

  return {
    allowed: false,
    reason: "free_ai_features_unavailable",
  };
}
