"use client";

import { useMemo, useState } from "react";
import moment from "moment";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/ui/DataTable";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { CalendarIcon, PlusIcon } from "@/components/shared/icons";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { UserRole } from "@/types/shared/user.types";
import { listHolidays } from "@/lib/services/aavahana/holiday.service";
import { LEAVE_DATE_FORMATS } from "@/lib/constants/leave.constants";
import type {
  HolidayRecord,
  HolidayType,
} from "@/types/aavahana/holiday.types";
import { HolidayModal } from "@/components/aavahana/leaves/HolidayModal";

const fmtDate = (d?: string | null) =>
  d ? moment(d).format(LEAVE_DATE_FORMATS.date) : "—";

const TYPE_VARIANT: Record<HolidayType, "primary" | "info" | "secondary"> = {
  public: "primary",
  optional: "info",
  restricted: "secondary",
};

const TYPE_LABEL: Record<HolidayType, string> = {
  public: "Public",
  optional: "Optional",
  restricted: "Restricted",
};

const columns: DataTableColumn<HolidayRecord>[] = [
  { key: "date", title: "Date", dataIndex: "date", render: fmtDate },
  { key: "name", title: "Name", dataIndex: "name" },
  {
    key: "type",
    title: "Type",
    dataIndex: "type",
    render: (t: HolidayType) => (
      <Badge label={TYPE_LABEL[t]} variant={TYPE_VARIANT[t]} size="sm" />
    ),
  },
  {
    key: "description",
    title: "Description",
    dataIndex: "description",
    render: (v: string | null) => v || "—",
  },
];

export function HolidaysTable() {
  const { hasRole } = useAuth();
  const canEdit = hasRole([UserRole.MANAGER, UserRole.ADMIN]);

  const currentYear = useMemo(() => new Date().getUTCFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<HolidayRecord | null>(null);

  const yearOptions = useMemo(() => {
    const yrs: number[] = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y += 1) yrs.push(y);
    return yrs;
  }, [currentYear]);

  const actions = (
    <div className="flex items-center gap-2">
      <select
        className="select select-sm select-bordered"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        aria-label="Year"
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      {canEdit && (
        <Button
          size="sm"
          color="primary"
          iconBefore={<PlusIcon size="sm" />}
          onClick={() => {
            setSelected(null);
            setModalOpen(true);
          }}
        >
          Add holiday
        </Button>
      )}
    </div>
  );

  return (
    <>
      <DataTable<HolidayRecord, { year: number }>
        title="Holidays"
        subtitle={
          canEdit
            ? "Org-wide holiday calendar. Holidays are excluded from leave day counts."
            : "Org-wide holiday calendar. Holidays are excluded from your leave day counts."
        }
        icon={<CalendarIcon />}
        actions={actions}
        query={{ year }}
        queryFn={listHolidays}
        columns={columns}
        defaultPageSize={50}
        onRowClick={(row) => {
          setSelected(row);
          setModalOpen(true);
        }}
        enableRefresh
        emptyState={{
          title: `No holidays configured for ${year}`,
          subtitle: canEdit
            ? "Add a holiday to start excluding it from leave day counts."
            : "Your manager hasn't added any holidays for this year yet.",
          icon: <CalendarIcon />,
        }}
      />
      <HolidayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        holiday={selected}
        canEdit={canEdit}
      />
    </>
  );
}
