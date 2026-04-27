import { verifyEmailToken } from "@/lib/auth/verification";

export const runtime = "nodejs";

function redirectToSignIn(request: Request, status: string) {
  const redirectUrl = new URL("/sign-in", request.url);

  redirectUrl.searchParams.set("emailVerification", status);

  return Response.redirect(redirectUrl, 303);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await verifyEmailToken({
    email: url.searchParams.get("email"),
    token: url.searchParams.get("token"),
  });

  return redirectToSignIn(request, result.status);
}
