import { resetPassword } from "@/lib/auth/password-reset";
import {
  checkRateLimit,
  createTooManyRequestsResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

type ResetPasswordRouteDeps = {
  checkRateLimit: typeof checkRateLimit;
  resetPassword: typeof resetPassword;
};

const defaultResetPasswordRouteDeps: ResetPasswordRouteDeps = {
  checkRateLimit,
  resetPassword,
};

export async function handleResetPasswordPost(
  request: Request,
  deps: ResetPasswordRouteDeps = defaultResetPasswordRouteDeps,
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

  const rateLimitResult = await deps.checkRateLimit("resetPassword", request);

  if (!rateLimitResult.success) {
    return createTooManyRequestsResponse(rateLimitResult);
  }

  const result = await deps.resetPassword(body);

  if (!result.ok) {
    return Response.json(
      {
        success: false,
        resetStatus: result.resetStatus,
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
      resetStatus: result.resetStatus,
      message: result.message,
    },
    {
      status: result.status,
    },
  );
}

export async function POST(request: Request) {
  return handleResetPasswordPost(request);
}
