"use client";

import { useState } from "react";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBlockList } from "@/lib/hooks/hcd/use-block";
import { isError } from "@/lib/api/client";
import { HcdBlockService } from "@/lib/services/hcd/block.service";
import type { FrameworkPrompts, PromptItem } from "@/lib/services/hcd/block.service";

function PromptCard({ prompt }: { prompt: PromptItem }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-base-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="neutral" icon={null} size="sm">{prompt.type}</Badge>
          <h4 className="font-semibold text-sm text-black mt-1">{prompt.title}</h4>
        </div>
        <Button variant="ghost" color="neutral" size="xs" className="shrink-0" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <p className="text-xs dt-text-dim mt-2 whitespace-pre-wrap line-clamp-4">
        {prompt.content}
      </p>
    </div>
  );
}

export function PromptCopy() {
  const { data: blocks } = useBlockList();
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<FrameworkPrompts | null>(null);
  const [loading, setLoading] = useState(false);

  const frameworks = blocks
    ? [...new Map(blocks.map((b) => [b.frameworkKey, b.frameworkName])).entries()]
    : [];

  const handleSelect = async (key: string) => {
    setSelectedFramework(key);
    setLoading(true);
    const res = await HcdBlockService.getPrompts(key);
    if (!isError(res)) {
      setPrompts(res);
    }
    setLoading(false);
  };

  return (
    <Section>
      <Section.Header
        title="Prompt library"
        subtitle="Copy a framework prompt into any LLM and apply it to live work."
      />
      <Section.Body className="space-y-4">
        {frameworks.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {frameworks.map(([key, name]) => (
              <Button
                key={key}
                color="primary"
                variant={selectedFramework === key ? undefined : "outline"}
                size="sm"
                onClick={() => handleSelect(key)}
              >
                {name}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : !selectedFramework ? (
          <EmptyState size="sm" title="Pick a framework" subtitle="Choose a framework above to see its prompts." />
        ) : prompts && prompts.prompts.length > 0 ? (
          <div className="space-y-3">
            {prompts.prompts.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        ) : (
          <EmptyState size="sm" title="No prompts yet" subtitle="No prompts available for this framework." />
        )}
      </Section.Body>
    </Section>
  );
}
