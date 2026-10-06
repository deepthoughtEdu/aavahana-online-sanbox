// src/components/shared/Pagination.tsx - Accept PaginationInfo directly

import React from "react";
import { Button } from "./Button";
import { paginationStyles } from "@/utils/shared/design.utils";
import { cn } from "@/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";
import { PaginationInfo } from "@/types";

interface PaginationProps {
  pagination: PaginationInfo;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  isFetching?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  perPage,
  onPageChange,
  onPerPageChange,
  isFetching = false,
}) => {
  const { currentPage, pageCount, prev, next, first } = pagination;

  const handlePrev = () => {
    if (prev.active) onPageChange(prev.page);
  };

  const handleNext = () => {
    if (next.active) onPageChange(next.page);
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPerPageChange(Number(e.target.value));
    // Reset to first page when changing page size
    if (currentPage !== first.page) onPageChange(first.page);
  };

  // Generate visible pages with ellipses
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    if (pageCount <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else {
      // Show with ellipses
      if (currentPage <= 3) {
        // Near the start: 1 2 3 4 ... last
        pages.push(1, 2, 3, 4, "...", pageCount);
      } else if (currentPage >= pageCount - 2) {
        // Near the end: 1 ... last-3 last-2 last-1 last
        pages.push(
          1,
          "...",
          pageCount - 3,
          pageCount - 2,
          pageCount - 1,
          pageCount
        );
      } else {
        // In the middle: 1 ... current-1 current current+1 ... last
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          pageCount
        );
      }
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 sm:gap-4 py-3 px-3 sm:px-4 border-t border-base-300 bg-white/50 rounded-b-lg">
      {/* Results Count */}
      <div className="text-xs sm:text-sm text-neutral font-medium order-1">
        Page{" "}
        <span className={paginationStyles.resultsHighlight}>
          {currentPage}
        </span>{" "}
        of{" "}
        <span className={paginationStyles.resultsHighlight}>
          {pageCount}
        </span>
      </div>

      {/* Page Navigation */}
      <div className="join border border-base-300 rounded-lg bg-white order-3 sm:order-2 overflow-x-auto max-w-full">
        {/* Prev */}
        <Button
          variant="ghost"
          size="sm"
          color="secondary"
          className="join-item flex-shrink-0"
          onClick={handlePrev}
          disabled={!prev.active || isFetching}
          aria-label="Previous page"
          iconBefore={<ArrowLeftIcon size="sm" />}
        />

        {/* Dynamic Page Buttons */}
        <div className="flex">
          {visiblePages.map((page, idx) =>
            page === "..." ? (
              <Button
                key={`ellipsis-${idx}`}
                variant="ghost"
                size="sm"
                className="join-item flex-shrink-0"
                disabled
              >
                ...
              </Button>
            ) : (
              <Button
                key={page}
                size="sm"
                color={page === currentPage ? 'primary' : 'secondary'}
                className={cn("join-item flex-shrink-0")}
                onClick={() => onPageChange(page as number)}
                disabled={isFetching}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          color="secondary"
          className="join-item flex-shrink-0"
          onClick={handleNext}
          disabled={!next.active || isFetching}
          aria-label="Next page"
          iconBefore={<ArrowRightIcon size="sm" />}
        />
      </div>

      {/* Per Page Selector */}
      <div className="flex items-center gap-2 order-2 sm:order-3">
        <label htmlFor="per-page" className="text-xs sm:text-sm text-neutral whitespace-nowrap">
          Rows:
        </label>
        <select
          id="per-page"
          className="select select-sm border-base-300 bg-white w-20"
          value={perPage}
          onChange={handlePerPageChange}
          disabled={isFetching}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};