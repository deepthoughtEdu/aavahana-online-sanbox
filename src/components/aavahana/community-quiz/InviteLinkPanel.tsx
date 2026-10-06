"use client";

import { useState } from "react";
import { useCommunityQuizInvite, useCommunityQuizParticipants } from "@/lib/hooks/aavahana/use-community-quiz";
import { toast } from "@/utils";

interface Props {
  quizId: number;
}

export function InviteLinkPanel({ quizId }: Props) {
  const { invite, isLoading } = useCommunityQuizInvite(quizId);
  const { participants } = useCommunityQuizParticipants(quizId);
  const [copied, setCopied] = useState(false);

  if (isLoading || !invite) {
    return <div className="text-xs dt-text-dim">Loading invite link…</div>;
  }

  const inviteUrl = `${window.location.origin}/aavahana/community-quiz/${quizId}/join?token=${invite.token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl border border-base-300 space-y-3">
      <h3 className="font-medium text-sm">Invite Participants</h3>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={inviteUrl}
          className="input input-bordered input-sm flex-1 font-mono text-xs"
        />
        <button className="btn btn-sm btn-primary" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs dt-text-dim">
        Share this link with participants. They&apos;ll be added once they click &quot;Join&quot;.
      </p>
      {participants.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium mb-1">{participants.length} participant(s) joined</p>
          <div className="flex flex-wrap gap-1">
            {participants.map((p) => (
              <span key={p.id} className="badge badge-sm badge-ghost">
                EID {p.eid}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
