import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Circle,
  Database,
  Folder,
  ShieldCheck,
} from "lucide-react";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/user-avatar";
import {
  itemTypeIconClasses,
  itemTypeIcons,
} from "@/components/dashboard/dashboard-icons";
import { Badge } from "@/components/ui/badge";
import {
  getProfileData,
  type ProfileItemTypeBreakdown,
} from "@/lib/db/profile";
import type { ItemTypeSlug } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | DevStash",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }

  const profileData = await getProfileData(session.user.id);

  if (!profileData) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }

  const displayName =
    profileData.user.name ?? profileData.user.email ?? "DevStash user";
  const displayEmail = profileData.user.email ?? "No email on file";

  return (
    <main className="min-h-screen bg-devstash-bg px-5 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
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
                Profile
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Account settings and workspace usage
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-lg border border-devstash-line bg-white/[0.035] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <UserAvatar
                className="size-20 text-2xl"
                email={profileData.user.email}
                imageUrl={profileData.user.image}
                name={profileData.user.name}
              />
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-semibold text-white">
                  {displayName}
                </h2>
                <p className="mt-2 truncate text-base text-muted-foreground">
                  {displayEmail}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profileData.user.authMethods.map((method) => (
                    <Badge
                      className="h-7 rounded-md border-devstash-line bg-white/[0.04] px-2 text-xs text-zinc-200"
                      key={method}
                      variant="outline"
                    >
                      <ShieldCheck
                        aria-hidden="true"
                        className="mr-1 size-3.5"
                      />
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
              <ProfileMetric
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                label="Joined"
                value={profileData.user.createdAtLabel}
              />
              <ProfileMetric
                icon={<Database aria-hidden="true" className="size-5" />}
                label="Items"
                value={formatCount(profileData.stats.totalItems)}
              />
              <ProfileMetric
                icon={<Folder aria-hidden="true" className="size-5" />}
                label="Collections"
                value={formatCount(profileData.stats.totalCollections)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Usage stats</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {profileData.stats.itemTypeBreakdown.map((itemType) => (
              <ItemTypeStat itemType={itemType} key={itemType.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-devstash-line bg-white/[0.025] p-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-3 truncate text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ItemTypeStat({ itemType }: { itemType: ProfileItemTypeBreakdown }) {
  return (
    <article
      className="rounded-lg border border-l-4 border-devstash-line bg-white/[0.025] p-4"
      style={{ borderLeftColor: itemType.color }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          {renderItemTypeIcon(itemType.slug)}
        </div>
        <p className="text-2xl font-semibold text-white">
          {formatCount(itemType.count)}
        </p>
      </div>
      <p className="mt-4 truncate text-sm text-muted-foreground">
        {itemType.label}
      </p>
    </article>
  );
}

function isKnownItemTypeSlug(slug: string): slug is ItemTypeSlug {
  return slug in itemTypeIcons;
}

function renderItemTypeIcon(slug: string) {
  if (isKnownItemTypeSlug(slug)) {
    const Icon = itemTypeIcons[slug];

    return (
      <Icon
        aria-hidden="true"
        className={`size-5 ${itemTypeIconClasses[slug]}`}
      />
    );
  }

  return <Circle aria-hidden="true" className="size-5 text-zinc-400" />;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
