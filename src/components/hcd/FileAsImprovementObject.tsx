"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { useCreateInitiative } from "@/lib/hooks/hcd/use-initiatives";

// One-tap "file this as a Spotted Improvement Object" (FE-W1.0 / W2.3).
// Constraint-sourced IOs carry no framework (frameworkKey is nullable). Reused by
// the heroics prompt (W2.3), the weekly report (W1.2), and the comm window (W2.5).
export function FileAsImprovementObject({
  defaultTitle = "",
  sourceType,
  sourceId,
  description,
  cta = "File as improvement",
  onFiled,
}: {
  defaultTitle?: string;
  sourceType: string;
  sourceId?: string;
  description?: string;
  cta?: string;
  onFiled?: (id: number) => void;
}) {
  const create = useCreateInitiative();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [filedId, setFiledId] = useState<number | null>(null);

  const file = async () => {
    if (!title.trim()) return;
    const io = await create.mutateAsync({
      title: title.trim(),
      description: description || title.trim(),
      status: "spotted",
      sourceType,
      sourceId,
    });
    setFiledId(io.id);
    setOpen(false);
    onFiled?.(io.id);
  };

  if (filedId) {
    return <span className="text-xs text-success">Filed as a Spotted improvement ✓</span>;
  }

  if (!open) {
    return (
      <Button color="primary" variant="outline" size="xs" onClick={() => setOpen(true)}>
        {cta}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Name the constraint in one line"
        className="input input-bordered input-sm w-full"
      />
      <div className="flex gap-2">
        <Button color="primary" size="xs" loading={create.isPending} disabled={!title.trim()} onClick={file}>
          File as improvement
        </Button>
        <Button color="neutral" variant="ghost" size="xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
