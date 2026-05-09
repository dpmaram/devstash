import { auth } from "@/auth";
import { getUserBillingState } from "@/lib/db/billing";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getAppBaseUrl } from "@/lib/stripe/config";
import { getStripeServerClient } from "@/lib/stripe/server";

type PortalRouteDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  getAppBaseUrl: typeof getAppBaseUrl;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  getStripeServerClient: () => {
    billingPortal: {
      sessions: {
        create: (input: {
          customer: string;
          return_url: string;
        }) => Promise<{ url: string }>;
      };
    };
  };
  getUserBillingState: typeof getUserBillingState;
};

const defaultPortalRouteDeps: PortalRouteDeps = {
  auth,
  getAppBaseUrl,
  getDashboardUserForSession,
  getStripeServerClient: () => getStripeServerClient(),
  getUserBillingState,
};

export async function handleStripePortalPost(
  _request: Request,
  deps: PortalRouteDeps = defaultPortalRouteDeps,
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
        error: "Unable to open billing portal.",
      },
      {
        status: 400,
      },
    );
  }

  const billingState = await deps.getUserBillingState(dashboardUser.id);

  if (!billingState?.stripeCustomerId) {
    return Response.json(
      {
        success: false,
        error: "No Stripe customer is linked to this account yet.",
      },
      {
        status: 400,
      },
    );
  }

  const stripe = deps.getStripeServerClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: billingState.stripeCustomerId,
    return_url: `${deps.getAppBaseUrl()}/settings`,
  });

  return Response.json({
    success: true,
    url: portalSession.url,
  });
}
