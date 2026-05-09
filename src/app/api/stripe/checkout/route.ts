import { handleStripeCheckoutPost } from "./route-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStripeCheckoutPost(request);
}
