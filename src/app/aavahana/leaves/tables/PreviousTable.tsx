"use client";

import { useState } from "react";
import moment from "moment";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/ui/DataTable";
import { formatLeaveDate, formatLeaveDays } from "@/utils/aavahana/leave.utils";
import { Badge } from "@/components/shared/Badge";
import { ClockIcon } from "@/components/shared/icons";
import { listPrevious } from "@/lib/services/aavahana/leave.service";
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

const columns: DataTableColumn<LeaveRecord>[] = [
  {
    key: "type",
    title: "Type",
    dataIndex: "type",
    render: (v: string) => (
      <span className="capitalize">{v?.replace("_", " ")}</span>
    ),
  },
  { key: "startDate", title: "From",     dataIndex: "startDate", render: fmtDate },
  { key: "endDate",   title: "To",       dataIndex: "endDate",   render: fmtDate },
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
  { key: "decidedAt", title: "Reviewed", dataIndex: "decidedAt", render: fromNow },
];

export function PreviousTable() {
  const [selected, setSelected] = useState<LeaveRecord | null>(null);

  return (
    <>
      <DataTable<LeaveRecord>
        title="Leave History"
        subtitle="Past leave records"
        icon={<ClockIcon />}
        queryFn={listPrevious}
        columns={columns}
        defaultPageSize={20}
        onRowClick={(row) => setSelected(row)}
        enableRefresh
        emptyState={{
          title: "No reviewed leaves yet",
          subtitle: "Decisions on your leave requests will appear here.",
          icon: <ClockIcon />,
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
