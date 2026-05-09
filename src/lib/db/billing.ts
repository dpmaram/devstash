import type { PlanTier } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type UserBillingState = {
  id: string;
  planTier: PlanTier;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type ActivateProBillingInput = {
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
};

export async function getUserBillingState(
  userId: string,
): Promise<UserBillingState | null> {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      planTier: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<UserBillingState> {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeCustomerId,
    },
    select: {
      id: true,
      planTier: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

export async function activateProBilling(
  userId: string,
  input: ActivateProBillingInput,
): Promise<UserBillingState> {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      planTier: "PRO",
      isPro: true,
      stripeSubscriptionId: input.stripeSubscriptionId,
      ...(input.stripeCustomerId
        ? {
            stripeCustomerId: input.stripeCustomerId,
          }
        : {}),
    },
    select: {
      id: true,
      planTier: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

export async function deactivateProBilling(
  userId: string,
): Promise<UserBillingState> {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      planTier: "FREE",
      isPro: false,
      stripeSubscriptionId: null,
    },
    select: {
      id: true,
      planTier: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}
