import type Stripe from "stripe";

import {
  activateProBilling,
  activateProBillingByStripeCustomerId,
  deactivateProBillingByStripeCustomerId,
} from "@/lib/db/billing";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { getStripeServerClient } from "@/lib/stripe/server";

type StripeWebhookRouteDeps = {
  activateProBilling: typeof activateProBilling;
  activateProBillingByStripeCustomerId: typeof activateProBillingByStripeCustomerId;
  deactivateProBillingByStripeCustomerId: typeof deactivateProBillingByStripeCustomerId;
  getStripeServerClient: () => {
    webhooks: {
      constructEvent: (
        payload: string,
        header: string,
        secret: string,
      ) => Stripe.Event;
    };
  };
  getStripeWebhookSecret: typeof getStripeWebhookSecret;
};

const defaultStripeWebhookRouteDeps: StripeWebhookRouteDeps = {
  activateProBilling,
  activateProBillingByStripeCustomerId,
  deactivateProBillingByStripeCustomerId,
  getStripeServerClient: () => getStripeServerClient(),
  getStripeWebhookSecret,
};

function isSubscriptionActive(status: Stripe.Subscription.Status) {
  return ["active", "trialing", "past_due"].includes(status);
}

async function handleCheckoutCompleted(
  event: Stripe.Event,
  deps: StripeWebhookRouteDeps,
) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  const customerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : null;
  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : null;

  if (!customerId || !subscriptionId) {
    return;
  }

  const updatedByCustomer = await deps.activateProBillingByStripeCustomerId(
    customerId,
    subscriptionId,
  );

  if (updatedByCustomer) {
    return;
  }

  const userId = checkoutSession.metadata?.userId;

  if (!userId) {
    return;
  }

  await deps.activateProBilling(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
}

async function handleSubscriptionUpdated(
  event: Stripe.Event,
  deps: StripeWebhookRouteDeps,
) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;

  if (!customerId) {
    return;
  }

  if (isSubscriptionActive(subscription.status)) {
    await deps.activateProBillingByStripeCustomerId(customerId, subscription.id);
    return;
  }

  await deps.deactivateProBillingByStripeCustomerId(customerId);
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  deps: StripeWebhookRouteDeps,
) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;

  if (!customerId) {
    return;
  }

  await deps.deactivateProBillingByStripeCustomerId(customerId);
}

export async function handleStripeWebhookPost(
  request: Request,
  deps: StripeWebhookRouteDeps = defaultStripeWebhookRouteDeps,
) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      {
        success: false,
        error: "Missing Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  const body = await request.text();
  const stripe = deps.getStripeServerClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      deps.getStripeWebhookSecret(),
    );
  } catch {
    return Response.json(
      {
        success: false,
        error: "Invalid Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event, deps);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event, deps);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event, deps);
      break;
    default:
      break;
  }

  return Response.json({
    success: true,
    received: true,
  });
}
