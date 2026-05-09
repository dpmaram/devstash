import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

type SearchParams = Record<string, string | string[] | undefined>;

type SignInPageProps = {
  searchParams?: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Sign in | DevStash",
};

function getSearchParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = getSearchParam(params, "callbackUrl") ?? "/dashboard";
  const error = getSearchParam(params, "error");
  const errorCode = getSearchParam(params, "code");
  const registered = getSearchParam(params, "registered") === "1";
  const emailVerificationRequired =
    getSearchParam(params, "emailVerificationRequired") !== "0";
  const emailVerificationStatus = getSearchParam(params, "emailVerification");
  const passwordResetStatus = getSearchParam(params, "passwordReset");

  return (
    <AuthShell
      eyebrow="Welcome back"
      showMarketingNav
      subtitle="Open your saved snippets, commands, prompts, notes, files, images, and links."
      title="Sign in to DevStash"
    >
      <SignInForm
        callbackUrl={callbackUrl}
        emailVerificationRequired={emailVerificationRequired}
        emailVerificationStatus={emailVerificationStatus}
        initialErrorCode={errorCode}
        initialError={error}
        passwordResetStatus={passwordResetStatus}
        registered={registered}
      />
    </AuthShell>
  );
}
