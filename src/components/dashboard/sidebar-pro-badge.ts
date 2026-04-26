const sidebarProBadgeSlugs = new Set(["file", "image"]);

export const SIDEBAR_PRO_BADGE_LABEL = "PRO";

export function shouldShowSidebarProBadge(slug: string) {
  return sidebarProBadgeSlugs.has(slug);
}
