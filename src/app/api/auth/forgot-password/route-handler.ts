import {
  createRequestPasswordResetDeps,
  requestPasswordReset,
} from "@/lib/auth/password-reset";
import {
  checkRateLimit,
  createTooManyRequestsResponse,
} from "@/lib/rate-limit";

type ForgotPasswordRouteDeps = {
  checkRateLimit: typeof checkRateLimit;
  createRequestPasswordResetDeps: typeof createRequestPasswordResetDeps;
  requestPasswordReset: typeof requestPasswordReset;
};

const defaultForgotPasswordRouteDeps: ForgotPasswordRouteDeps = {
  checkRateLimit,
  createRequestPasswordResetDeps,
  requestPasswordReset,
};

export async function handleForgotPasswordPost(
  request: Request,
  deps: ForgotPasswordRouteDeps = defaultForgotPasswordRouteDeps,
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

  const rateLimitResult = await deps.checkRateLimit("forgotPassword", request);

  if (!rateLimitResult.success) {
    return createTooManyRequestsResponse(rateLimitResult);
  }

  const result = await deps.requestPasswordReset(
    body,
    deps.createRequestPasswordResetDeps(),
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
