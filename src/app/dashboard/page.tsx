import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-devstash-bg text-foreground">
      <header className="flex h-20 items-center gap-4 border-b border-devstash-line bg-devstash-bg px-6">
        <div className="relative min-w-0 flex-1 max-w-2xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search items"
            className="h-11 rounded-lg border-devstash-line bg-white/[0.04] pl-11 text-base text-foreground placeholder:text-muted-foreground"
            placeholder="Search items..."
            readOnly
          />
        </div>
        <Button
          className="h-11 gap-2 rounded-lg bg-foreground px-5 text-base font-medium text-background hover:bg-foreground/90"
          type="button"
        >
          <Plus aria-hidden="true" className="size-5" />
          New Item
        </Button>
      </header>

      <div className="grid min-h-[calc(100vh-5rem)] grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-devstash-line bg-black/20 p-6">
          <h2 className="text-2xl font-semibold text-foreground">Sidebar</h2>
        </aside>
        <section className="p-8">
          <h2 className="text-2xl font-semibold text-foreground">Main</h2>
        </section>
      </div>
    </main>
  );
}
