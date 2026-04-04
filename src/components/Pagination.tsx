import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page number list with ellipsis
  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--separator)] bg-gray-50/60">
      <p className="text-xs text-[var(--muted-foreground)] font-medium">
        Showing <span className="font-bold text-[var(--foreground)]">{start}–{end}</span> of{" "}
        <span className="font-bold text-[var(--foreground)]">{totalItems}</span> entries
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-[var(--separator)] text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {getPages().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-[var(--muted-foreground)] text-sm select-none">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold border transition-all ${
                currentPage === page
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                  : "border-[var(--separator)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-[var(--separator)] text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
