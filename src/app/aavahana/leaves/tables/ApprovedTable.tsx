"use client";

import { useState } from "react";
import moment from "moment";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/ui/DataTable";
import { formatLeaveDate, formatLeaveDays } from "@/utils/aavahana/leave.utils";
import { Badge } from "@/components/shared/Badge";
import { EyeIcon } from "@/components/shared/icons";
import { listApproved } from "@/lib/services/aavahana/leave.service";
import {
  LEAVE_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
} from "@/lib/constants/leave.constants";
import type {
  LeaveRecord,
  LeaveStatus,
} from "@/types/aavahana/leave.types";
import { ViewModal } from "@/components/aavahana/leaves/ViewModal";

// Leave bounds are calendar days resolved in the org zone, not instants in
// the viewer's zone. See formatLeaveDate.
const fmtDate = (d?: string | null) => formatLeaveDate(d);
const fromNow = (d?: string | null) => (d ? moment(d).fromNow() : "—");
const applicantName = (r: LeaveRecord) =>
  r.user?.fullname || r.user?.username || "—";

const columns: DataTableColumn<LeaveRecord>[] = [
  {
    key: "applicant",
    title: "Applicant",
    render: (_v: unknown, r: LeaveRecord) => applicantName(r),
  },
  { key: "startDate", title: "From",    dataIndex: "startDate", render: fmtDate },
  { key: "endDate",   title: "To",      dataIndex: "endDate",   render: fmtDate },
  // Real consumed amount as a decimal, not the rounded `days` Int.
  { key: "days", title: "Days", render: (_v: unknown, r: LeaveRecord) => formatLeaveDays(r) },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    render: (s: LeaveStatus) => (
      <Badge label={LEAVE_STATUS_LABELS[s]} variant={LEAVE_STATUS_COLORS[s]} size="sm" />
    ),
  },
  { key: "decidedAt", title: "Decided", dataIndex: "decidedAt", render: fromNow },
];

export function ApprovedTable() {
  const [selected, setSelected] = useState<LeaveRecord | null>(null);

  return (
    <>
      <DataTable<LeaveRecord>
        title="Reviewed Leaves"
        subtitle="Decisions you have made"
        icon={<EyeIcon />}
        queryFn={listApproved}
        columns={columns}
        defaultPageSize={20}
        onRowClick={(row) => setSelected(row)}
        enableRefresh
        emptyState={{
          title: "No decisions yet",
          subtitle: "Leaves you approve or reject will show up here.",
          icon: <EyeIcon />,
        }}
      />
      <ViewModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        leave={selected}
      />
    </>
  );
}
