// src/components/ui/DataTable.tsx - Fixed for new PaginationInfo structure
'use client';

import Table, { TableProps as RcTableProps } from 'rc-table';
import type { ColumnType } from 'rc-table/lib/interface';
import 'rc-table/assets/index.css';
import { useState, useEffect, useMemo, useCallback, ReactNode, useImperativeHandle, forwardRef } from 'react';
import { PaginatedQueryResult, PaginatedResponseWrapper, PaginationParams, SingleQueryResult } from '@/types';
import { useApi } from '@/lib/hooks/shared/use-api';
import { ignoreTextSelection } from '@/utils/shared/selection.utils';
import { Pagination } from '@/components/shared/Pagination';
import { Section } from '@/components/shared/Section';
import { OverlayLoading } from '@/components/shared/OverlayLoading';
import { EmptyState, type EmptyStateProps } from '@/components/shared/EmptyState';
import { AlertCircleIcon, InboxIcon, RefreshIcon, SpinnerIcon } from '@/components/shared/icons';
import { Button } from '../Button';
import { cn } from '@/utils';
import { Centered } from '../Centerted';

// ============================================
// TYPE DEFINITIONS
// ============================================

import { ApiResult } from '@/lib/api/client';

export interface DataTableRef {
  refresh: () => void;
}

export interface DataTableColumn<T = Record<string, string>> extends Partial<ColumnType<T>> {
  label?: string;
  key: string;
}

interface DataTableOwnProps
  <T extends object = Record<string, unknown>,
    TQuery extends Record<string, string | number | boolean | undefined> = Record<string, never>
  > {
  queryFn: (params: PaginationParams & TQuery) =>
    | Promise<ApiResult<PaginatedResponseWrapper<T>>>
    | Promise<ApiResult<T[]>>
    | Promise<ApiResult<T>>;

  columns: DataTableColumn<T>[];
  defaultPageSize?: number;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableRefresh?: boolean;
  actions?: ReactNode;
  query?: TQuery;
  heightVh?: number;
  /**
   * When true, the table grows to fit its rows and the PAGE scrolls (one
   * natural scrollbar) instead of the table being a fixed-height panel with
   * its own internal vertical scroll. Use on screens where the table sits
   * below other content (filters, etc.) and a nested scroll feels broken.
   * Horizontal scrolling for wide tables still happens inside the table.
   */
  autoHeight?: boolean;
  classNames?: string;
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: ReactNode;
  onRowClick?: (record: T, index?: number) => void;
  /**
   * Fires with the rows currently rendered, whenever they change. The table
   * owns its data, so a parent that needs to act on the visible page (a
   * select-all header checkbox, an export button, a running total) has no other
   * way to see it. Pass a `useCallback`-stable function: it is an effect
   * dependency, and a fresh identity each render would loop.
   */
  onRowsChange?: (rows: T[]) => void;
  /**
   * Per-table overrides for the built-in empty state — title, subtitle, icon,
   * etc. — spread on top of the defaults. Useful when you want a one-line
   * customization without composing a full component.
   */
  emptyState?: Partial<EmptyStateProps>;
  /**
   * Full empty-state slot. When the query returns zero rows AND the user
   * isn't currently searching, the table renders `children` instead of its
   * default `<EmptyState />`. Use this when you want complete control over
   * the empty render (e.g., custom illustration, multiple CTAs). Takes
   * precedence over `emptyState` if both are supplied. Search-with-no-results
   * always falls back to the built-in "Try a different search term." copy.
   */
  children?: ReactNode;
}

type DataTableProps
  <T extends object = Record<string, unknown>,
    TQuery extends Record<string, string | number | boolean | undefined> = Record<string, never>
  > = DataTableOwnProps<T, TQuery> &
  Omit<RcTableProps<T>, 'columns' | 'data' | 'scroll' | 'title'> & {
    scroll?: RcTableProps<T>['scroll'];
  };

// ============================================
// CONSTANTS
// ============================================
const HEADER_HEIGHT = 81;
const PAGINATION_HEIGHT = 64;

// ============================================
// MAIN COMPONENT
// ============================================

function DataTableInner
  <T extends object = Record<string, unknown>,
    TQuery extends Record<string, string | number | boolean | undefined> = Record<string, never>
  >(
    {
      queryFn,
      columns,
      defaultPageSize = 10,
      searchPlaceholder = 'Search...',
      enableSearch = false,
      enableRefresh = false,
      query = {} as TQuery,
      title,
      subtitle,
      actions,
      icon,
      classNames,
      heightVh = 83,
      autoHeight = false,
      onRowClick,
      onRowsChange,
      emptyState,
      children,
      sticky = true,
      tableLayout = 'auto',
      onRow,
      ...rcTableProps
    }: DataTableProps<T, TQuery>,
    ref: React.Ref<DataTableRef>
  ) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    perPage: defaultPageSize,
    search: '',
  });

  const [searchInput, setSearchInput] = useState('');

  // ============================================
  // SEARCH DEBOUNCING
  // ============================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ============================================
  // DATA FETCHING
  // ============================================

  // src/components/ui/DataTable.tsx - Fix pagination type inference

  // ... (keep everything the same until the data fetching section)

  // ============================================
  // DATA FETCHING
  // ============================================

  const mergedParams = useMemo(() => ({ ...params, ...query } as PaginationParams & TQuery), [params, query]);

  // Cast the result to the correct type to help TypeScript infer properly
  const queryResult = useApi({
    queryKey: ['datatable', queryFn.name, mergedParams],
    queryFn: () => queryFn(mergedParams),
    staleTime: 30000,
    gcTime: 60000,
    placeholderData: (previousData) => previousData,
    structuralSharing: true,
  }) as PaginatedQueryResult<T> | SingleQueryResult<T[] | T>;

  const { data, pagination, isLoading, error, refetch, isFetching } = queryResult;

  useImperativeHandle(ref, () => ({
    refresh: () => {
      refetch();
    },
  }));

  // ============================================
  // DATA NORMALIZATION
  // ============================================

  const isPaginated = !!pagination;

  const tableData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];
    return [data] as T[];
  }, [data]);

  // Let a parent see the visible page (see onRowsChange).
  useEffect(() => {
    onRowsChange?.(tableData);
  }, [tableData, onRowsChange]);


  // ============================================
  // HEIGHT
  // ============================================
  //
  // The content area is sized by flexbox, NOT by an explicit height. It used to
  // get `calc(${heightVh}vh - header - pagination - 50px)`, which assumed the
  // panel was exactly `heightVh` tall. It never reliably is: the panel's height
  // is min(max(content, 20rem), heightVh), so on a short viewport, or whenever
  // the rows did not fill the slot, the assumed height overshot the real one.
  // The rows then overflowed their slot and the pagination bar was drawn on top
  // of the last row. Header and footer are fixed-height and the content is
  // `flex-1 min-h-0`, so the three always sum to exactly the panel height and
  // the overflow lands where it belongs: inside the scroll container.

  // ============================================
  // TABLE COLUMNS
  // ============================================

  const rcColumns = useMemo(
    () =>
      columns.map(col => ({
        ...col,
        title: col.label || col.title,
        dataIndex: col.dataIndex || col.key,
        key: col.key,
      })),
    [columns]
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handlePageChange = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setParams(prev => ({ ...prev, perPage: newPerPage, page: 1 }));
  }, []);

  // ============================================
  // RENDER
  // ============================================
  const tableNode = (
    <Table<T>
      {...rcTableProps}
      columns={rcColumns}
      data={tableData}
      sticky={autoHeight ? false : sticky}
      emptyText=""
      tableLayout={tableLayout}
      rowKey={(record, index) =>
        (record as Record<string, string>)?.id ??
        (record as Record<string, string>)?._id ??
        index?.toString() ??
        "0"
      }
      onRow={(record, index) => {
        const parentOnRow = onRow?.(record, index) || {};

        return {
          ...parentOnRow,
          // Guarded centrally: a drag-select released inside a row must not
          // fire the row action (it would navigate or open a modal over the
          // text the user is copying). Covers every onRowClick consumer.
          onClick: ignoreTextSelection((event: React.MouseEvent) => {
            parentOnRow.onClick?.(event);
            onRowClick?.(record, index);
          }),
          className: cn(
            parentOnRow.className,
            onRowClick && "cursor-pointer hover:bg-white"
          ),
        };
      }}
    />
  );

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative bg-white rounded-lg border border-base-300 overflow-hidden flex flex-col",
          classNames
        )}
        // minHeight gives the content area a definite floor — without it an
        // empty/errored table collapses to just its header (content resolves
        // to 0). Populated fixed-height tables exceed it, so they're unchanged.
        // In autoHeight mode there is no maxHeight: the panel grows to its rows
        // and the page provides the single, natural scroll.
        style={autoHeight ? { minHeight: "20rem" } : { minHeight: "20rem", maxHeight: `${heightVh}vh` }}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0" style={{ height: `${HEADER_HEIGHT}px` }}>
          <Section.Header className='relative z-50' size='md' icon={icon} title={title as string} subtitle={subtitle}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              {actions && <div className="flex items-center gap-2">{actions}</div>}

              {enableSearch && (
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="input input-sm w-full sm:w-64"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    disabled={isLoading}
                  />
                  {isFetching && !isLoading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <SpinnerIcon size='sm' color='primary' />
                    </div>
                  )}
                </div>
              )}

              {enableRefresh && (
                <Button
                  square
                  color='secondary'
                  onClick={() => refetch()}
                  disabled={isLoading || isFetching}
                  loading={isFetching}
                  iconBefore={<RefreshIcon size='sm' />}
                  aria-label="Refresh"
                />
              )}
            </div>
          </Section.Header>
        </div>

        {/* Content - Scrollable with Sticky Headers (fixed-height mode) or
            natural-height (autoHeight mode, page scrolls). */}
        <div
          className={cn("relative", autoHeight ? "min-h-72" : "flex-1 min-h-0")}
        >
          {/* Overlay */}
          {isFetching && (
            <Centered>
              <OverlayLoading overlayContainerClassName="" title="Refreshing..." />
            </Centered>
          )}

          {/* Error State */}
          {error ? (
            <Centered>
              <EmptyState
                variant="error"
                title="Failed to load data"
                subtitle={error.message}
                icon={<AlertCircleIcon size='xl' />}
              >
                <Button
                  size="sm"
                  color='primary'
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </EmptyState>
            </Centered>
          ) : !isFetching && tableData.length === 0 ? (
            <Centered>
              {!searchInput && children ? (
                children
              ) : (
                <EmptyState
                  resourceName="record"
                  plural
                  icon={<InboxIcon />}
                  subtitle={
                    searchInput
                      ? "Try a different search term."
                      : "No records available."
                  }
                  {...(searchInput ? {} : emptyState)}
                />
              )}
            </Centered>
          ) : autoHeight ? (
            // Natural height: rows render in full, the page scrolls vertically.
            // Wide tables still scroll horizontally inside the table.
            <div className="overflow-x-auto">{tableNode}</div>
          ) : (
            <div className="h-full overflow-auto scrollbar-hide">
              <div className="min-w-full overflow-x-auto">{tableNode}</div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {!isLoading && !error && params.perPage && tableData.length > 0 && (
          <div
            // relative + z-10 so the bar always paints above the scroll area
            // rather than being overlapped by a row that scrolled under it.
            className="relative z-10 flex-shrink-0 border-t border-base-300 bg-base-100"
            style={{ minHeight: `${PAGINATION_HEIGHT}px` }}
          >
            {isPaginated ? (
              <Pagination
                pagination={pagination}
                perPage={params.perPage as number}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                isFetching={isFetching}
              />
            ) : (
              <div className="text-xs sm:text-sm px-4 sm:px-6 py-3 text-neutral h-full flex items-center">
                Showing {tableData.length} {tableData.length === 1 ? 'item' : 'items'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const DataTable = forwardRef(DataTableInner) as
  <T extends object = Record<string, unknown>,
    TQuery extends Record<string, string | number | boolean | undefined> = Record<string, never>
  >(
    props: DataTableProps<T, TQuery> & { ref?: React.Ref<DataTableRef> }
  ) => ReturnType<typeof DataTableInner>;