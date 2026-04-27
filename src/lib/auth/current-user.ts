import type { Session } from "next-auth";

import type { CurrentUser } from "@/lib/mock-data";

export function toCurrentUser(
  sessionUser: Session["user"] | null | undefined,
  fallbackUser: CurrentUser,
): CurrentUser {
  const email = sessionUser?.email ?? fallbackUser.email;
  const name = sessionUser?.name ?? email ?? fallbackUser.name;

  return {
    id: sessionUser?.id ?? fallbackUser.id,
    name,
    email,
    avatarUrl: sessionUser?.image ?? null,
    planTier: fallbackUser.planTier,
  };
}
