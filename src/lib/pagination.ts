export const ITEMS_PER_PAGE = 2;
export const COLLECTIONS_PER_PAGE = 2;

export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

export function parsePageNumber(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function getPaginationOffset(page: number, pageSize: number) {
  return (Math.max(page, 1) - 1) * pageSize;
}

export function getTotalPages(totalItems: number, pageSize: number) {
  if (totalItems <= 0) {
    return 1;
  }

  return Math.ceil(totalItems / pageSize);
}
