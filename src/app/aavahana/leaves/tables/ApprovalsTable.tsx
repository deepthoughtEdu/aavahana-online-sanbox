"use client";

import { useMemo, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/ui/DataTable";
import { formatLeaveDate, formatLeaveDays } from "@/utils/aavahana/leave.utils";
import { Button } from "@/components/shared/Button";
import { CheckIcon } from "@/components/shared/icons";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { listApprovals } from "@/lib/services/aavahana/leave.service";
import type { LeaveApprovalRow } from "@/types/aavahana/leave.types";
import { UserRole } from "@/types/shared/user.types";
import { EditModal } from "@/components/aavahana/leaves/EditModal";

// Leave bounds are calendar days resolved in the org zone, not instants in
// the viewer's zone. See formatLeaveDate.
const fmtDate = (d?: string | null) => formatLeaveDate(d);
const applicantName = (r: LeaveApprovalRow) =>
  r.user?.fullname || r.user?.username || "—";

const columns: DataTableColumn<LeaveApprovalRow>[] = [
  {
    key: "applicant",
    title: "Applicant",
    render: (_v: unknown, r: LeaveApprovalRow) => applicantName(r),
  },
  {
    key: "type",
    title: "Type",
    dataIndex: "type",
    render: (v: string) => (
      <span className="capitalize">{v?.replace("_", " ")}</span>
    ),
  },
  { key: "startDate", title: "From",   dataIndex: "startDate", render: fmtDate },
  { key: "endDate",   title: "To",     dataIndex: "endDate",   render: fmtDate },
  // Real consumed amount as a decimal, not the rounded `days` Int.
  { key: "days", title: "Days", render: (_v: unknown, r: LeaveApprovalRow) => formatLeaveDays(r) },
  { key: "reason",    title: "Reason", dataIndex: "reason" },
];

export function ApprovalsTable() {
  const { hasRole } = useAuth();
  // Only managers / admins can browse approvals across the org. Plain members
  // are pinned to their own queue (no toggle, no scope switching).
  const canSeeAllOrg = hasRole([UserRole.MANAGER, UserRole.ADMIN]);

  const [scope, setScope] = useState<"me" | "all">("me");
  const effectiveScope: "me" | "all" = canSeeAllOrg ? scope : "me";

  const [selected, setSelected] = useState<LeaveApprovalRow | null>(null);

  const scopeToggle = useMemo(
    () =>
      canSeeAllOrg ? (
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
      ) : null,
    [canSeeAllOrg, scope]
  );

  return (
    <>
      <DataTable<LeaveApprovalRow, { type: "me" | "all" }>
        title="Pending Approvals"
        subtitle="Leaves awaiting your review"
        icon={<CheckIcon />}
        actions={scopeToggle}
        query={{ type: effectiveScope }}
        queryFn={listApprovals}
        columns={columns}
        defaultPageSize={20}
        onRowClick={(row) => row.canReview && setSelected(row)}
        enableRefresh
        emptyState={{
          title:
            effectiveScope === "me"
              ? "Nothing in your queue"
              : "No pending leave requests",
          subtitle:
            effectiveScope === "me"
              ? "Leaves where you're the chosen approver will appear here."
              : "Switch back to 'My queue' to see leaves that need your decision.",
          icon: <CheckIcon />,
        }}
      />
      <EditModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        leave={selected}
      />
    </>
  );
}
