"use client";

import moment from "moment";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Section } from "@/components/shared/Section";
import { CalculationDisplay } from "./CalculationDisplay";
import { UserInfo } from "./UserInfo";
import { useLeaveMutations } from "@/lib/hooks/aavahana/use-leaves";
import { useAlert } from "@/lib/hooks/shared/use-alert";
import { canOwnerCancelLeave } from "@/lib/utils/leave.utils";
import { formatLeaveDate } from "@/utils/aavahana/leave.utils";
import {
  LEAVE_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
} from "@/lib/constants/leave.constants";
import type { LeaveRecord } from "@/types/aavahana/leave.types";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveRecord | null;
  canCancel?: boolean;
}

export function ViewModal({ isOpen, onClose, leave, canCancel }: ViewModalProps) {
  const { cancel, isCancelling } = useLeaveMutations();
  const { confirm } = useAlert();

  if (!leave) return null;

  const handleCancel = async () => {
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
      onClose();
    } catch {
      /* surfaced */
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      {canCancel && canOwnerCancelLeave(leave) && (
        <Button
          color="error"
          variant="soft"
          onClick={handleCancel}
          loading={isCancelling}
        >
          Cancel leave
        </Button>
      )}
      <Button variant="ghost" color="secondary" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave details"
      subtitle={`From ${formatLeaveDate(leave.startDate)} to ${formatLeaveDate(leave.endDate)}`}
      footer={footer}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <UserInfo
            uid={leave.appliedByUid}
            title="Requested by"
            name={leave.user?.fullname || leave.user?.username}
            picture={leave.user?.picture ?? null}
          />
          {leave.requestedTo && (
            <UserInfo
              uid={leave.requestedTo}
              title="Requested to"
              name={leave.requestedToUser?.fullname || leave.requestedToUser?.username}
              picture={leave.requestedToUser?.picture ?? null}
            />
          )}

          <div className="bg-base-200 rounded-lg">
            <div className="p-3 space-y-2">
              <Row label="Status">
                <span className="inline-flex items-center gap-2">
                  <Badge
                    label={LEAVE_STATUS_LABELS[leave.status]}
                    variant={LEAVE_STATUS_COLORS[leave.status]}
                    size="sm"
                  />
                  {leave.isUrgent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/15 text-error">
                      URGENT
                    </span>
                  )}
                </span>
              </Row>
              <Row label="Type">
                <span className="text-xs font-medium capitalize">
                  {leave.type.replace("_", " ")}
                </span>
              </Row>
              <Row label="Applied">
                <span className="text-xs">
                  {moment(leave.appliedAt).fromNow()}
                </span>
              </Row>
              {leave.decidedAt && (
                <Row label="Reviewed">
                  <span className="text-xs">
                    {moment(leave.decidedAt).fromNow()}
                  </span>
                </Row>
              )}
              {leave.note && (
                <div className="pt-2 mt-1">
                  <div className="text-xs text-base-content/60 mb-1">Review note</div>
                  <div className="text-xs">{leave.note}</div>
                </div>
              )}
            </div>
          </div>

          {(leave.urgentReason || leave.noSupervisorReason) && (
            <Section variant="ghost">
              <Section.Header
                size="sm"
                title={
                  leave.isUrgent
                    ? "Why this is urgent"
                    : "Why applied without supervisor"
                }
              />
              <Section.Body>
                {leave.urgentReason && (
                  <p className="text-xs whitespace-pre-wrap">
                    {leave.urgentReason}
                  </p>
                )}
                {leave.noSupervisorReason && (
                  <p className="text-xs whitespace-pre-wrap mt-1">
                    {leave.noSupervisorReason}
                  </p>
                )}
              </Section.Body>
            </Section>
          )}

          {(leave.teamName || leave.description || leave.deliverables || leave.assignee) && (
            <Section variant="ghost">
              <Section.Header size="sm" title="Context" />
              <Section.Body>
                {leave.teamName && <Row label="Team">{leave.teamName}</Row>}
                {leave.description && <Row label="Description">{leave.description}</Row>}
                {leave.deliverables && <Row label="Deliverables">{leave.deliverables}</Row>}
                {leave.assignee && <Row label="Alternate">{leave.assignee}</Row>}
              </Section.Body>
            </Section>
          )}
        </div>

        <div className="lg:col-span-2">
          <CalculationDisplay
            startDate={leave.startDate}
            endDate={leave.endDate}
            calculated={leave.calculated}
          />
        </div>
      </div>
    </Modal>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-base-content/60">{label}</span>
      <span className="text-xs text-right max-w-[60%] truncate">{children}</span>
    </div>
  );
}
