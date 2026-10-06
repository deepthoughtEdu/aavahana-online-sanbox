"use client";

import React, { useState } from "react";
import moment from "moment";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/ui/DataTable";
import { formatLeaveDate, formatLeaveDays } from "@/utils/aavahana/leave.utils";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { ClipboardIcon, PlusIcon } from "@/components/shared/icons";
import { listAllMine } from "@/lib/services/aavahana/leave.service";
import { useLeaveMutations } from "@/lib/hooks/aavahana/use-leaves";
import { useAlert } from "@/lib/hooks/shared/use-alert";
import { canOwnerCancelLeave } from "@/lib/utils/leave.utils";
import {
  LEAVE_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
} from "@/lib/constants/leave.constants";
import type {
  LeaveRecord,
  LeaveStatus,
  MyLeavesStatusFilter,
} from "@/types/aavahana/leave.types";
import { ViewModal } from "@/components/aavahana/leaves/ViewModal";
import { EmptyState } from "@/components/shared/EmptyState";

// Leave bounds are calendar days resolved in the org zone, not instants in
// the viewer's zone. See formatLeaveDate.
const fmtDate = (d?: string | null) => formatLeaveDate(d);
const fromNow = (d?: string | null) => (d ? moment(d).fromNow() : "—");

const STATUS_FILTERS: { key: MyLeavesStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
];

/**
 * Inline cancel control for a single leave row. The hook is called per-row so
 * the loading state is local. Backend revalidates the cancellation rules
 * defensively, but this gates the button so the user only sees it when
 * cancellation is actually allowed.
 */
function CancelLeaveAction({ leave }: { leave: LeaveRecord }) {
  const { cancel, isCancelling } = useLeaveMutations();
  const { confirm } = useAlert();

  if (!canOwnerCancelLeave(leave)) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't open the ViewModal underneath
    const result = await confirm({
      type: "warning",
      title: "Cancel this leave?",
      message:
        "Are you sure you want to cancel this leave request? This cannot be undone.",
      confirmText: "Yes, cancel leave",
      cancelText: "Keep leave",
    });
    if (!result.isConfirmed) return;
    try {
      await cancel(leave.id);
    } catch {
      // surfaced via the toast in the api client / mutation hook
    }
  };

  return (
    <Button
      size="xs"
      color="error"
      variant="soft"
      onClick={handleClick}
      loading={isCancelling}
    >
      Cancel
    </Button>
  );
}

const columns: DataTableColumn<LeaveRecord>[] = [
  {
    key: "type",
    title: "Type",
    dataIndex: "type",
    render: (v: string, r: LeaveRecord) => (
      <span className="inline-flex items-center gap-2">
        <span className="capitalize">{v?.replace("_", " ")}</span>
        {r.isUrgent && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/15 text-error">
            URGENT
          </span>
        )}
      </span>
    ),
  },
  { key: "startDate", title: "From", dataIndex: "startDate", render: fmtDate },
  { key: "endDate", title: "To", dataIndex: "endDate", render: fmtDate },
  // Real consumed amount as a decimal, not the rounded `days` Int.
  { key: "days", title: "Days", render: (_v: unknown, r: LeaveRecord) => formatLeaveDays(r) },
  {
    // Who the request went to. The backend already joins this on every row
    // (same field the detail modal reads), so it costs no extra call.
    key: "requestedTo",
    title: "Requested to",
    render: (_v: unknown, r: LeaveRecord) =>
      r.requestedToUser?.fullname || r.requestedToUser?.username || "—",
  },
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
    title: "Reviewed",
    dataIndex: "decidedAt",
    render: fromNow,
  },
  {
    key: "actions",
    title: "Actions",
    render: (_v: unknown, r: LeaveRecord) => <CancelLeaveAction leave={r} />,
  },
];

interface Props {
  onApply: () => void;
}

/**
 * "My Leaves" — all leaves the user has applied for, pending and decided,
 * latest first (backend `orderBy: { id: 'desc' }`). Replaces the previous
 * Applied/History split.
 *
 * Filter chips: All · Pending · Approved. "All" omits the status param so
 * the backend returns every leave (including rejected / modified / cancelled).
 *
 * Per-row Cancel button shown when the leave is still cancellable
 * (pending, modified, or approved-with-future-start).
 */
export function AppliedTable({ onApply }: Props) {
  const [selected, setSelected] = useState<LeaveRecord | null>(null);
  // Default to Pending so users land on the leaves that still need attention;
  // approvals already opens on its pending queue, this keeps the two in sync.
  const [statusFilter, setStatusFilter] =
    useState<MyLeavesStatusFilter>("pending");

  // When "all" → omit the status param so the backend returns every leave.
  const query = statusFilter === "all" ? {} : { status: statusFilter };

  const chips = (
    <div className="flex items-center gap-2">
      <div className="join">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.key}
            size="xs"
            color={statusFilter === f.key ? "primary" : "secondary"}
            variant={statusFilter === f.key ? undefined : "ghost"}
            onClick={() => setStatusFilter(f.key)}
            className="join-item"
          >
            {f.label}
          </Button>
        ))}
      </div>
      <Button
        size="sm"
        color="primary"
        iconBefore={<PlusIcon size="sm" />}
        onClick={onApply}
      >
        Apply for leave
      </Button>
    </div>
  );

  return (
    <>
      <DataTable<LeaveRecord, { status?: LeaveStatus }>
        title="Applied Leaves"
        subtitle="All leaves you've submitted, latest first."
        icon={<ClipboardIcon />}
        actions={chips}
        query={query}
        queryFn={listAllMine}
        columns={columns}
        defaultPageSize={20}
        onRowClick={(row) => setSelected(row)}
        enableRefresh
        // See the note in ApprovalsUnifiedView: as a fixed-height panel the
        // last row of a page gets sliced against the bottom edge with no
        // visible scrollbar to explain why.
        autoHeight
      >
        <EmptyState
          title={
            statusFilter === "pending"
              ? "No pending leaves"
              : statusFilter === "approved"
                ? "No approved leaves"
                : "No leaves yet"
          }
          subtitle={
            statusFilter === "all"
              ? "Click 'Apply for leave' to submit your first request."
              : `No leaves with status "${statusFilter}".`
          }
          icon={<ClipboardIcon />}
        />
      </DataTable>
      <ViewModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        leave={selected}
        canCancel
      />
    </>
  );
}
