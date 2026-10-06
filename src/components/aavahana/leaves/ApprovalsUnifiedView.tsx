"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/ui/DataTable";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { CheckIcon, EyeIcon } from "@/components/shared/icons";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useAlert } from "@/lib/hooks/shared/use-alert";
import { useBulkLeaveDecision } from "@/lib/hooks/aavahana/use-leaves";
import { toast } from "@/utils";
import {
  listApprovals,
  listViewable,
} from "@/lib/services/aavahana/leave.service";
import {
  LEAVE_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
} from "@/lib/constants/leave.constants";
import { formatLeaveDate, formatLeaveDays } from "@/utils/aavahana/leave.utils";
import type {
  LeaveApprovalRow,
  LeaveCalculation,
  LeaveRecord,
  LeaveStatus,
  ApprovalsStatusFilter,
} from "@/types/aavahana/leave.types";
import { UserRole } from "@/types/shared/user.types";
import { EditModal } from "./EditModal";
import { ViewModal } from "./ViewModal";

type TopTab = "mine" | "viewable";

// The viewable tab takes no query params. Hoisted so the object identity is
// stable — an inline `{}` is a fresh object every render, which re-derives
// DataTable's merged params on every pass for no reason.
const NO_QUERY = {} as Record<string, never>;

// URGENT chip — shown on the Applicant column when leave.isUrgent is true.
// Tiny, all-caps, error-toned. Lives here so we don't need to import another
// component just for the badge style.
function UrgentChip() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/15 text-error">
      URGENT
    </span>
  );
}

/**
 * Unified Approvals workspace — replaces the previous Pending + Reviewed
 * stacked tables with one DataTable + filter chips.
 *
 * Filter chips: Pending · Reviewed · All
 * Backend supports all three via `?status=` on /v3/pdgms/people/leaves/approvals.
 *
 * For managers/admins, an extra "My queue / All org" scope toggle controls
 * whether approvals across the whole org are shown.
 */
// Leave bounds are calendar days, resolved in the org zone — not instants in
// the viewer's zone. `decidedAt` IS an instant, so it keeps plain moment.
const fmtDate = (d?: string | null) => formatLeaveDate(d);
const fromNow = (d?: string | null) => (d ? moment(d).fromNow() : "—");
const applicantName = (r: LeaveApprovalRow) =>
  r.user?.fullname || r.user?.username || "—";

const STATUS_FILTERS: { key: ApprovalsStatusFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed" },
  { key: "all", label: "All" },
];

/**
 * Only rows this reviewer may actually decide get a checkbox. `canReview` is
 * computed server-side per caller, so an already-decided row or someone else's
 * queue can never be swept into a bulk action by selecting it here.
 */
const isSelectable = (r: LeaveApprovalRow) => r.canReview && !r.reviewed;

const columns: DataTableColumn<LeaveApprovalRow>[] = [
  {
    key: "applicant",
    title: "Applicant",
    render: (_v: unknown, r: LeaveApprovalRow) => (
      <span className="inline-flex items-center gap-2">
        {applicantName(r)}
        {r.isUrgent && <UrgentChip />}
      </span>
    ),
  },
  {
    key: "type",
    title: "Type",
    dataIndex: "type",
    render: (v: string) => (
      <span className="capitalize">{v?.replace("_", " ")}</span>
    ),
  },
  { key: "startDate", title: "From", dataIndex: "startDate", render: fmtDate },
  { key: "endDate", title: "To", dataIndex: "endDate", render: fmtDate },
  // Real consumed amount as a decimal, not the rounded `days` Int.
  { key: "days", title: "Days", render: (_v: unknown, r: { days?: number | null; calculated?: LeaveCalculation | null }) => formatLeaveDays(r) },
  { key: "reason", title: "Reason", dataIndex: "reason" },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    render: (s: LeaveStatus) => (
      <Badge
        label={LEAVE_STATUS_LABELS[s]}
        variant={LEAVE_STATUS_COLORS[s]}
        size="sm"
      />
    ),
  },
  {
    key: "decidedAt",
    title: "Decided",
    dataIndex: "decidedAt",
    render: fromNow,
  },
];

// Viewable-tab columns: same shape as approvals but no decision action and we
// pull from /leaves/viewable (LeaveRecord, not LeaveApprovalRow).
const viewableColumns: DataTableColumn<LeaveRecord>[] = [
  {
    key: "applicant",
    title: "Applicant",
    render: (_v: unknown, r: LeaveRecord) => (
      <span className="inline-flex items-center gap-2">
        {r.user?.fullname || r.user?.username || "—"}
        {r.isUrgent && <UrgentChip />}
      </span>
    ),
  },
  {
    key: "type",
    title: "Type",
    dataIndex: "type",
    render: (v: string) => (
      <span className="capitalize">{v?.replace("_", " ")}</span>
    ),
  },
  { key: "startDate", title: "From", dataIndex: "startDate", render: fmtDate },
  { key: "endDate", title: "To", dataIndex: "endDate", render: fmtDate },
  // Real consumed amount as a decimal, not the rounded `days` Int.
  { key: "days", title: "Days", render: (_v: unknown, r: { days?: number | null; calculated?: LeaveCalculation | null }) => formatLeaveDays(r) },
  { key: "reason", title: "Reason", dataIndex: "reason" },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    render: (s: LeaveStatus) => (
      <Badge
        label={LEAVE_STATUS_LABELS[s]}
        variant={LEAVE_STATUS_COLORS[s]}
        size="sm"
      />
    ),
  },
];

export function ApprovalsUnifiedView() {
  const { hasRole } = useAuth();
  const canSeeAllOrg = hasRole([UserRole.MANAGER, UserRole.ADMIN]);

  // Top-level tab — "mine" is the existing approvals queue (my queue / all org
  // sub-toggle still applies). "viewable" is the read-only org-wide list.
  const [topTab, setTopTab] = useState<TopTab>("mine");

  const [status, setStatus] = useState<ApprovalsStatusFilter>("pending");
  const [scope, setScope] = useState<"me" | "all">("me");
  const effectiveScope: "me" | "all" = canSeeAllOrg ? scope : "me";

  const [editTarget, setEditTarget] = useState<LeaveApprovalRow | null>(null);
  const [viewTarget, setViewTarget] = useState<LeaveApprovalRow | null>(null);
  const [viewableTarget, setViewableTarget] = useState<LeaveRecord | null>(
    null,
  );

  // ── Bulk review ───────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { decideMany, isDeciding } = useBulkLeaveDecision();
  const { confirm } = useAlert();

  // Any change of tab, status or scope swaps the underlying rows, so a
  // carried-over selection would point at leaves no longer on screen.
  useEffect(() => {
    setSelected(new Set());
  }, [topTab, status, effectiveScope]);

  const toggleRow = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // The rows currently on screen, so the header checkbox can select the page.
  // Must be useCallback-stable: DataTable calls it from an effect.
  const [pageRows, setPageRows] = useState<LeaveApprovalRow[]>([]);
  const handleRowsChange = useCallback((rows: LeaveApprovalRow[]) => {
    setPageRows(rows);
  }, []);

  const selectableIds = useMemo(
    () => pageRows.filter(isSelectable).map((r) => r.id),
    [pageRows],
  );
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      // Selecting adds this page to whatever is already picked; clearing only
      // removes this page, so a selection made on page 1 survives paging.
      if (selectableIds.every((id) => next.has(id))) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [selectableIds]);

  const approvalColumns = useMemo<DataTableColumn<LeaveApprovalRow>[]>(
    () => [
      {
        key: "select",
        // Select every reviewable row on this page. Hidden when the page has
        // nothing decidable, so it never offers a no-op.
        title: selectableIds.length ? (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={allSelected}
            ref={(el) => {
              // Partial selection is a third state and has no React prop.
              if (el) el.indeterminate = !allSelected && someSelected;
            }}
            onChange={toggleAll}
            aria-label={allSelected ? "Clear selection" : "Select all on this page"}
          />
        ) : null,
        width: 44,
        render: (_v: unknown, r: LeaveApprovalRow) =>
          isSelectable(r) ? (
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={selected.has(r.id)}
              // The row's onClick opens the review modal; stop the checkbox
              // from triggering it.
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggleRow(r.id)}
              aria-label={`Select ${applicantName(r)}'s leave request`}
            />
          ) : null,
      },
      ...columns,
    ],
    [selected, toggleRow, selectableIds, allSelected, someSelected, toggleAll],
  );

  const runBulk = useCallback(
    async (decision: "approved" | "rejected") => {
      const ids = Array.from(selected);
      if (!ids.length) return;

      const verb = decision === "approved" ? "Approve" : "Reject";
      const noun = `${ids.length} leave request${ids.length === 1 ? "" : "s"}`;

      // Name who is affected. After a select-all the count alone is not
      // reviewable — nobody remembers who was in the set — and a confirmation
      // nobody can check is just a second click. Three names then a tail: past
      // that it reads as a wall of text and stops being scannable. Only rows on
      // the current page can be named; anything picked on another page is
      // covered by the tail.
      const byId = new Map(pageRows.map((r) => [r.id, applicantName(r)]));
      const named = ids.map((id) => byId.get(id)).filter(Boolean) as string[];
      const shown = named.slice(0, 3);
      const unshown = ids.length - shown.length;
      const who = shown.length
        ? `${shown.join(", ")}${unshown > 0 ? ` and ${unshown} more` : ""}`
        : noun;

      const answer = await confirm({
        type: decision === "approved" ? "confirm" : "warning",
        title: `${verb} ${noun}?`,
        message: `${who} will be ${decision} and notified by email. This cannot be undone from here.`,
        confirmText: `Yes, ${verb.toLowerCase()} ${ids.length}`,
        cancelText: "Cancel",
      });
      if (!answer.isConfirmed) return;

      const result = await decideMany(ids, { status: decision });
      setSelected(new Set());

      const done = result.succeeded.length;
      const failed = result.failed.length;
      if (!failed) {
        toast.success(
          `${done} request${done === 1 ? "" : "s"} ${decision}`,
        );
      } else if (!done) {
        toast.error(`Could not ${verb.toLowerCase()} any of the ${ids.length}`);
      } else {
        // Partial success is the interesting case: someone else may have
        // decided a row first. Say what landed rather than a blanket failure.
        toast.error(`${done} ${decision}, ${failed} failed`);
      }
    },
    [selected, confirm, decideMany, pageRows],
  );

  const topTabs = (
    <div className="join mb-3">
      <Button
        size="sm"
        color={topTab === "mine" ? "primary" : "secondary"}
        variant={topTab === "mine" ? undefined : "ghost"}
        onClick={() => setTopTab("mine")}
        className="join-item"
      >
        My Requests
      </Button>
      <Button
        size="sm"
        color={topTab === "viewable" ? "primary" : "secondary"}
        variant={topTab === "viewable" ? undefined : "ghost"}
        onClick={() => setTopTab("viewable")}
        className="join-item"
      >
        Viewable Requests
      </Button>
    </div>
  );

  const headerActions = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        {selected.size > 0 && (
          <div className="flex items-center gap-2 pr-2 mr-1 border-r border-base-300">
            <span className="text-xs font-medium text-base-content/70">
              {selected.size} selected
            </span>
            <Button
              size="xs"
              color="success"
              onClick={() => runBulk("approved")}
              loading={isDeciding}
              disabled={isDeciding}
            >
              Approve
            </Button>
            <Button
              size="xs"
              color="error"
              variant="soft"
              onClick={() => runBulk("rejected")}
              loading={isDeciding}
              disabled={isDeciding}
            >
              Reject
            </Button>
            <Button
              size="xs"
              color="secondary"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              disabled={isDeciding}
            >
              Clear
            </Button>
          </div>
        )}
        <div className="join">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="xs"
              color={status === f.key ? "primary" : "secondary"}
              variant={status === f.key ? undefined : "ghost"}
              onClick={() => setStatus(f.key)}
              className="join-item"
            >
              {f.label}
            </Button>
          ))}
        </div>
        {canSeeAllOrg && (
          <div className="join">
            <Button
              size="xs"
              color={scope === "me" ? "primary" : "secondary"}
              variant={scope === "me" ? undefined : "ghost"}
              onClick={() => setScope("me")}
              className="join-item"
            >
              My queue
            </Button>
            <Button
              size="xs"
              color={scope === "all" ? "primary" : "secondary"}
              variant={scope === "all" ? undefined : "ghost"}
              onClick={() => setScope("all")}
              className="join-item"
            >
              All org
            </Button>
          </div>
        )}
      </div>
    ),
    [status, scope, canSeeAllOrg, selected, isDeciding, runBulk],
  );

  const subtitle =
    status === "pending"
      ? "Leaves awaiting your review"
      : status === "reviewed"
        ? "Decisions you've already made"
        : "All requests — pending and reviewed";

  const isReviewed = status === "reviewed";
  const icon = isReviewed ? <EyeIcon /> : <CheckIcon />;

  const emptyState = {
    title:
      status === "pending"
        ? effectiveScope === "me"
          ? "Nothing in your queue"
          : "No pending leave requests"
        : isReviewed
          ? "No decisions yet"
          : "Nothing here yet",
    subtitle:
      status === "pending"
        ? "Leaves where you're the chosen approver will appear here."
        : isReviewed
          ? "Leaves you approve, reject, or modify will appear here."
          : undefined,
    icon: isReviewed ? <EyeIcon /> : <CheckIcon />,
  };

  function handleRowClick(row: LeaveApprovalRow) {
    if (row.canReview && !row.reviewed) {
      setEditTarget(row);
    } else {
      setViewTarget(row);
    }
  }

  return (
    <>
      {topTabs}
      {topTab === "mine" ? (
        // Both tabs render a <DataTable> at the same position, so without
        // distinct keys React reuses one instance across the switch. That
        // instance carries its page/search state over AND — because DataTable
        // sets `placeholderData: prev => prev` — keeps painting the previous
        // tab's rows through the new tab's columns until the fetch lands.
        // Separate keys force a clean mount per tab.
        <DataTable<
          LeaveApprovalRow,
          { type: "me" | "all"; status: ApprovalsStatusFilter }
        >
          key="approvals"
          title="Leave Approvals"
          subtitle={subtitle}
          icon={icon}
          actions={headerActions}
          query={{ type: effectiveScope, status }}
          queryFn={listApprovals}
          columns={approvalColumns}
          defaultPageSize={20}
          onRowsChange={handleRowsChange}
          onRowClick={handleRowClick}
          enableRefresh
          emptyState={emptyState}
          // Grow to fit the rows and let the page scroll. As a fixed-height
          // panel the last row of a page was sliced in half against the bottom
          // edge, and the scroll region is `scrollbar-hide`, so there was no
          // affordance saying it scrolled. A full page of 10 that you cannot
          // see all of reads as broken.
          autoHeight
        />
      ) : (
        <DataTable<LeaveRecord, Record<string, never>>
          key="viewable"
          title="Viewable Requests"
          subtitle="Every active leave in your org — read-only."
          icon={<EyeIcon />}
          query={NO_QUERY}
          queryFn={listViewable}
          columns={viewableColumns}
          defaultPageSize={20}
          onRowClick={(row) => setViewableTarget(row)}
          enableRefresh
          autoHeight
          emptyState={{
            title: "No active leaves",
            subtitle: "Nobody in your org has a pending or approved leave.",
            icon: <EyeIcon />,
          }}
        />
      )}
      <EditModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        leave={editTarget}
      />
      <ViewModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        leave={viewTarget}
      />
      <ViewModal
        isOpen={!!viewableTarget}
        onClose={() => setViewableTarget(null)}
        leave={viewableTarget}
      />
    </>
  );
}
