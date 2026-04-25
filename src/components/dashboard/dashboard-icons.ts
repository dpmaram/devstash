import type { LucideIcon } from "lucide-react";
import {
  Code2,
  File,
  ImageIcon,
  LinkIcon,
  NotebookText,
  Sparkles,
  Terminal,
} from "lucide-react";

import type { ItemTypeSlug } from "@/lib/mock-data";

export const itemTypeIcons: Record<ItemTypeSlug, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  command: Terminal,
  note: NotebookText,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

export const itemTypeIconClasses: Record<ItemTypeSlug, string> = {
  snippet: "text-blue-400",
  prompt: "text-violet-400",
  command: "text-orange-400",
  note: "text-yellow-300",
  file: "text-zinc-400",
  image: "text-pink-400",
  link: "text-emerald-400",
};
