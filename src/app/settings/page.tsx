import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { getProfileData } from "@/lib/db/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | DevStash",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fsettings");
  }

  const profileData = await getProfileData(session.user.id);

  if (!profileData) {
    redirect("/sign-in?callbackUrl=%2Fsettings");
  }

  return (
    <main className="min-h-screen bg-devstash-bg px-5 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-devstash-line bg-white/[0.04] px-3 text-sm font-medium text-foreground transition hover:bg-white/[0.08]"
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Manage your account security and preferences
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Account actions</h2>
          <ProfileActions
            canChangePassword={profileData.user.canChangePassword}
            email={profileData.user.email}
          />
        </section>
      </div>
    </main>
  );
}
