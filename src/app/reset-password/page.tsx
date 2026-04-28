import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type SearchParams = Record<string, string | string[] | undefined>;

type ResetPasswordPageProps = {
  searchParams?: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Reset password | DevStash",
};

function getSearchParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const email = getSearchParam(params, "email");
  const token = getSearchParam(params, "token");

  return (
    <AuthShell
      eyebrow="Account recovery"
      subtitle="Choose a new password and return to your DevStash workspace."
      title="Reset your password"
    >
      <ResetPasswordForm email={email} token={token} />
    </AuthShell>
  );
}
