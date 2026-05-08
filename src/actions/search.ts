"use server";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import { getSearchIndex } from "@/lib/db/search";

export async function getSearchIndexAction() {
  const session = await auth();
  const user = await getDashboardUserForSession(session?.user);
  return getSearchIndex(user);
}
