export type StripeRequiredEnvVar =
  | "STRIPE_SECRET_KEY"
  | "STRIPE_PRICE_PRO_MONTHLY"
  | "STRIPE_PRICE_PRO_ANNUAL";

export type StripeOptionalEnvVar =
  | "STRIPE_WEBHOOK_SECRET"
  | "STRIPE_PUBLISHABLE_KEY";

export type StripePriceConfig = {
  proMonthlyPriceId: string;
  proAnnualPriceId: string;
};

export function getRequiredStripeEnvVar(
  name: StripeRequiredEnvVar,
  env: NodeJS.ProcessEnv = process.env,
) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required Stripe environment variable: ${name}`);
  }

  return value;
}

export function getOptionalStripeEnvVar(
  name: StripeOptionalEnvVar,
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[name] ?? null;
}

export function getStripeSecretKey(env: NodeJS.ProcessEnv = process.env) {
  return getRequiredStripeEnvVar("STRIPE_SECRET_KEY", env);
}

export function getStripePriceConfig(
  env: NodeJS.ProcessEnv = process.env,
): StripePriceConfig {
  return {
    proMonthlyPriceId: getRequiredStripeEnvVar("STRIPE_PRICE_PRO_MONTHLY", env),
    proAnnualPriceId: getRequiredStripeEnvVar("STRIPE_PRICE_PRO_ANNUAL", env),
  };
}

export function getStripeWebhookSecret(env: NodeJS.ProcessEnv = process.env) {
  const webhookSecret = getOptionalStripeEnvVar("STRIPE_WEBHOOK_SECRET", env);

  if (!webhookSecret) {
    throw new Error(
      "Missing required Stripe environment variable: STRIPE_WEBHOOK_SECRET",
    );
  }

  return webhookSecret;
}
