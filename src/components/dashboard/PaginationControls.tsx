import Link from "next/link";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
};

export function PaginationControls({
  currentPage,
  totalPages,
  getPageHref,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {hasPrevious ? (
        <Link
          className="rounded-md border border-devstash-line bg-white/[0.03] px-3 py-1.5 text-sm text-foreground transition hover:bg-white/[0.08]"
          href={getPageHref(currentPage - 1)}
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-devstash-line bg-white/[0.02] px-3 py-1.5 text-sm text-muted-foreground">
          Previous
        </span>
      )}

      {pages.map((pageNumber) => {
        const isActive = pageNumber === currentPage;

        return isActive ? (
          <span
            aria-current="page"
            className="rounded-md border border-sky-400/50 bg-sky-400/15 px-3 py-1.5 text-sm font-medium text-sky-200"
            key={pageNumber}
          >
            {pageNumber}
          </span>
        ) : (
          <Link
            className="rounded-md border border-devstash-line bg-white/[0.03] px-3 py-1.5 text-sm text-foreground transition hover:bg-white/[0.08]"
            href={getPageHref(pageNumber)}
            key={pageNumber}
          >
            {pageNumber}
          </Link>
        );
      })}

      {hasNext ? (
        <Link
          className="rounded-md border border-devstash-line bg-white/[0.03] px-3 py-1.5 text-sm text-foreground transition hover:bg-white/[0.08]"
          href={getPageHref(currentPage + 1)}
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-devstash-line bg-white/[0.02] px-3 py-1.5 text-sm text-muted-foreground">
          Next
        </span>
      )}
    </nav>
  );
}
