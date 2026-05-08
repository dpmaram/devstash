import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";

import { auth } from "@/auth";
import { getFavoritesData } from "@/lib/db/favorites";
import { FavoritesListView } from "@/components/favorites/FavoritesListView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Favorites | DevStash",
};

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Ffavorites");
  }

  const favoritesData = await getFavoritesData({
    user: { id: session.user.id },
  });

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
            <div className="flex items-center gap-3">
              <Heart aria-hidden="true" className="size-8 text-red-400" />
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Favorites
              </h1>
            </div>
            <p className="mt-2 text-base text-muted-foreground">
              Your saved items and collections
            </p>
          </div>
        </div>

        <FavoritesListView data={favoritesData} />
      </div>
    </main>
  );
}
