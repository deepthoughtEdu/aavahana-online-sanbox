"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PROSE = [
  "prose prose-stone prose-sm max-w-none",
  "prose-headings:font-semibold prose-headings:text-base-content",
  "prose-h1:mt-0 prose-h1:mb-4 prose-h1:text-xl",
  "prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-lg prose-h2:border-b prose-h2:border-base-300 prose-h2:pb-2",
  "prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-base",
  "prose-h4:mt-4 prose-h4:mb-1.5 prose-h4:text-sm",
  "prose-p:leading-relaxed",
  "prose-li:leading-relaxed",
  "prose-table:text-xs prose-th:text-left",
  "prose-code:before:content-none prose-code:after:content-none",
  "prose-blockquote:border-l-primary prose-blockquote:not-italic",
].join(" ");

/**
 * Shared markdown renderer for CRM deal assets (the first markdown render in the
 * CRM area). Wraps react-markdown + remark-gfm once so tables/blockquotes from
 * the sample deliverables render consistently.
 */
export function AssetMarkdown({ content }: { content: string }) {
  return (
    <div className={PROSE}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
