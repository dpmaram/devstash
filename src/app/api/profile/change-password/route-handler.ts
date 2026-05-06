import type { Session } from "next-auth";

import { auth } from "@/auth";
import {
  changePassword,
  createChangePasswordDeps,
} from "@/lib/auth/account-actions";
import {
  checkRateLimit,
  createTooManyRequestsResponse,
} from "@/lib/rate-limit";

type ChangePasswordRouteDeps = {
  auth: () => Promise<Session | null>;
  changePassword: typeof changePassword;
  checkRateLimit: typeof checkRateLimit;
  createChangePasswordDeps: typeof createChangePasswordDeps;
};

const defaultChangePasswordRouteDeps: ChangePasswordRouteDeps = {
  auth,
  changePassword,
  checkRateLimit,
  createChangePasswordDeps,
};

export async function handleChangePasswordPost(
  request: Request,
  deps: ChangePasswordRouteDeps = defaultChangePasswordRouteDeps,
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

  const rateLimitResult = await deps.checkRateLimit("changePassword", request, {
    identifier: session.user.id,
  });

  if (!rateLimitResult.success) {
    return createTooManyRequestsResponse(rateLimitResult);
  }

  const result = await deps.changePassword(
    {
      ...(typeof body === "object" && body !== null ? body : {}),
      userId: session.user.id,
    },
    deps.createChangePasswordDeps(),
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

  return Response.json({
    success: true,
    message: result.message,
  });
}
