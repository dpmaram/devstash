import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/user-avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | DevStash",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }

  return (
    <main className="min-h-screen bg-devstash-bg px-5 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-devstash-line bg-white/[0.04] px-3 text-sm font-medium text-foreground transition hover:bg-white/[0.08]"
          href="/dashboard"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Dashboard
        </Link>

        <section className="rounded-lg border border-devstash-line bg-white/[0.035] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              className="size-16 text-lg"
              email={session.user.email}
              imageUrl={session.user.image}
              name={session.user.name}
            />
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-semibold text-white">
                {session.user.name ?? session.user.email}
              </h1>
              <p className="mt-2 truncate text-base text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
