import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/stripe/config";

let stripeServerClient: Stripe | null = null;

export function getStripeServerClient() {
  if (!stripeServerClient) {
    stripeServerClient = new Stripe(getStripeSecretKey());
  }

  return stripeServerClient;
}
