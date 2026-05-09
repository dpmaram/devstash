import { auth } from "@/auth";
import {
  getUserBillingState,
  setStripeCustomerId,
} from "@/lib/db/billing";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getStripeServerClient } from "@/lib/stripe/server";
import {
  getAppBaseUrl,
  getStripePriceIdForCycle,
  type StripeBillingCycle,
} from "@/lib/stripe/config";

type CheckoutRequestBody = {
  billingCycle?: string;
};

type CheckoutRouteDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
      email?: string | null;
    };
  } | null>;
  getAppBaseUrl: typeof getAppBaseUrl;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  getStripePriceIdForCycle: typeof getStripePriceIdForCycle;
  getStripeServerClient: () => {
    customers: {
      create: (input: {
        email?: string;
        metadata: {
          userId: string;
        };
      }) => Promise<{ id: string }>;
    };
    checkout: {
      sessions: {
        create: (input: {
          mode: "subscription";
          customer: string;
          client_reference_id: string;
          metadata: {
            userId: string;
            billingCycle: StripeBillingCycle;
          };
          line_items: {
            price: string;
            quantity: number;
          }[];
          success_url: string;
          cancel_url: string;
        }) => Promise<{ url: string | null }>;
      };
    };
  };
  getUserBillingState: typeof getUserBillingState;
  setStripeCustomerId: typeof setStripeCustomerId;
};

const defaultCheckoutRouteDeps: CheckoutRouteDeps = {
  auth,
  getAppBaseUrl,
  getDashboardUserForSession,
  getStripePriceIdForCycle,
  getStripeServerClient: () => getStripeServerClient(),
  getUserBillingState,
  setStripeCustomerId,
};

function normalizeBillingCycle(value: unknown): StripeBillingCycle {
  return value === "annual" ? "annual" : "monthly";
}

export async function handleStripeCheckoutPost(
  request: Request,
  deps: CheckoutRouteDeps = defaultCheckoutRouteDeps,
) {
  const session = await deps.auth();

  if (!session?.user?.id) {
    return Response.json(
      {
        success: false,
        error: "You must be signed in.",
      },
      {
        status: 401,
      },
    );
  }

  const dashboardUser = await deps.getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return Response.json(
      {
        success: false,
        error: "Unable to start checkout.",
      },
      {
        status: 400,
      },
    );
  }

  let body: CheckoutRequestBody = {};

  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    body = {};
  }

  const billingCycle = normalizeBillingCycle(body.billingCycle);
  const stripe = deps.getStripeServerClient();
  const userBillingState = await deps.getUserBillingState(dashboardUser.id);

  if (!userBillingState) {
    return Response.json(
      {
        success: false,
        error: "Unable to start checkout.",
      },
      {
        status: 400,
      },
    );
  }

  let stripeCustomerId = userBillingState.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: {
        userId: dashboardUser.id,
      },
    });

    const updatedBillingState = await deps.setStripeCustomerId(
      dashboardUser.id,
      customer.id,
    );

    stripeCustomerId = updatedBillingState.stripeCustomerId;
  }

  if (!stripeCustomerId) {
    return Response.json(
      {
        success: false,
        error: "Unable to start checkout.",
      },
      {
        status: 400,
      },
    );
  }

  const appBaseUrl = deps.getAppBaseUrl();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: dashboardUser.id,
    metadata: {
      userId: dashboardUser.id,
      billingCycle,
    },
    line_items: [
      {
        price: deps.getStripePriceIdForCycle(billingCycle),
        quantity: 1,
      },
    ],
    success_url: `${appBaseUrl}/settings?billing=success`,
    cancel_url: `${appBaseUrl}/settings?billing=cancelled`,
  });

  if (!checkoutSession.url) {
    return Response.json(
      {
        success: false,
        error: "Unable to start checkout.",
      },
      {
        status: 502,
      },
    );
  }

  return Response.json({
    success: true,
    url: checkoutSession.url,
  });
}
