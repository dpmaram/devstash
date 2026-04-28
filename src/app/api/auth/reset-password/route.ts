import { resetPassword } from "@/lib/auth/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  const result = await resetPassword(body);

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
