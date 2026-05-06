import { createRegisterUserDeps, registerUser } from "@/lib/auth/registration";
import {
  checkRateLimit,
  createTooManyRequestsResponse,
} from "@/lib/rate-limit";

type RegisterRouteDeps = {
  checkRateLimit: typeof checkRateLimit;
  createRegisterUserDeps: typeof createRegisterUserDeps;
  registerUser: typeof registerUser;
};

const defaultRegisterRouteDeps: RegisterRouteDeps = {
  checkRateLimit,
  createRegisterUserDeps,
  registerUser,
};

export async function handleRegisterPost(
  request: Request,
  deps: RegisterRouteDeps = defaultRegisterRouteDeps,
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

  const rateLimitResult = await deps.checkRateLimit("register", request);

  if (!rateLimitResult.success) {
    return createTooManyRequestsResponse(rateLimitResult);
  }

  const result = await deps.registerUser(body, deps.createRegisterUserDeps());

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
      user: result.user,
      emailVerificationRequired: result.emailVerificationRequired,
    },
    {
      status: result.status,
    },
  );
}
