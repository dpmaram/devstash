import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

type SearchParams = Record<string, string | string[] | undefined>;

type RegisterPageProps = {
  searchParams?: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Create account | DevStash",
};

function getSearchParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = getSearchParam(params, "callbackUrl") ?? "/dashboard";

  return (
    <AuthShell
      eyebrow="Create account"
      subtitle="Start collecting the working knowledge you reuse across projects."
      title="Join DevStash"
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
