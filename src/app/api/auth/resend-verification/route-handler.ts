import {
  createRequestEmailVerificationDeps,
  requestEmailVerification,
} from "@/lib/auth/resend-verification";
import {
  checkRateLimit,
  createTooManyRequestsResponse,
} from "@/lib/rate-limit";

type ResendVerificationRouteDeps = {
  checkRateLimit: typeof checkRateLimit;
  requestEmailVerification: typeof requestEmailVerification;
};

const defaultResendVerificationRouteDeps: ResendVerificationRouteDeps = {
  checkRateLimit,
  requestEmailVerification,
};

function getEmailIdentifier(body: unknown) {
  if (typeof body !== "object" || body === null || !("email" in body)) {
    return null;
  }

  const email = body.email;

  return typeof email === "string" ? email : null;
}

export async function handleResendVerificationPost(
  request: Request,
  deps: ResendVerificationRouteDeps = defaultResendVerificationRouteDeps,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        error: "Request body must be valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const rateLimitResult = await deps.checkRateLimit(
    "resendVerification",
    request,
    {
      identifier: getEmailIdentifier(body),
    },
  );

  if (!rateLimitResult.success) {
    return createTooManyRequestsResponse(rateLimitResult);
  }

  const result = await deps.requestEmailVerification(
    body,
    createRequestEmailVerificationDeps(),
  );

  if (!result.ok) {
    return Response.json(
      {
        success: false,
        error: result.error,
      },
      {
        status: result.status,
      },
    );
  }

  return Response.json(
    {
      success: true,
      message: result.message,
    },
    {
      status: result.status,
    },
  );
}
