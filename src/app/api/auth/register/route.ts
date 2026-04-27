import { registerUser } from "@/lib/auth/registration";

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

  const result = await registerUser(body);

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
    },
    {
      status: result.status,
    },
  );
}
