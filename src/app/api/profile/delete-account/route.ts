import { auth } from "@/auth";
import {
  createDeleteAccountDeps,
  deleteAccount,
} from "@/lib/auth/account-actions";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
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

  const session = await auth();

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

  const result = await deleteAccount(
    {
      ...(typeof body === "object" && body !== null ? body : {}),
      userId: session.user.id,
    },
    createDeleteAccountDeps(),
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
