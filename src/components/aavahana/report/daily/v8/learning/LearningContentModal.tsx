"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ExternalLink,
  FileText,
  Play,
  X,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/shared/Button";
import { isError } from "@/lib/api/client";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";
import {
  byokConfigAtom,
  normalizeByokModel,
} from "@/lib/store/shared/byok.store";
import { iconSizes } from "@/utils/shared/design.utils";
import type { LearningSuggestion } from "@/types/aavahana/learning.types";

interface LearningContentModalProps {
  isOpen: boolean;
  suggestion: LearningSuggestion;
  onClose: () => void;
  returnMessage?: string;
}

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts a playable id from the YouTube URLs the backend can return.
 * Search-result URLs deliberately return null because choosing an arbitrary
 * result in the browser would make the recommendation less trustworthy.
 */
export function youtubeVideoId(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") candidate = url.searchParams.get("v");
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
          candidate = parts[1] ?? null;
        }
      }
    }

    return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function sourceName(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function LearningContentModal({
  isOpen,
  suggestion,
  onClose,
  returnMessage = "Closing this returns you to your report.",
}: LearningContentModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const readingRequestRef = useRef<string | null>(null);
  const byok = useAtomValue(byokConfigAtom);
  const [expansion, setExpansion] = useState<string | null>(suggestion.expansion);
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);

  const candidateVideoId = useMemo(
    () =>
      suggestion.kind === "viewing"
        ? youtubeVideoId(suggestion.searchUrl)
        : null,
    [suggestion.kind, suggestion.searchUrl],
  );
  const source = useMemo(
    () => sourceName(suggestion.searchUrl),
    [suggestion.searchUrl],
  );
  const videoId = suggestion.verified ? candidateVideoId : null;
  const isVideo = Boolean(videoId);
  const hasByok = Boolean(byok.apiKey && byok.provider && byok.model);

  const createReading = useCallback(async () => {
    if (expansion || loadingExpansion || !hasByok) return;
    setLoadingExpansion(true);
    setExpansionError(null);
    try {
      const res = await ReportV7Service.expandSuggestion({
        suggestionId: suggestion.id,
        apiKey: byok.apiKey,
        provider: byok.provider,
        model: normalizeByokModel(byok.model),
      });
      if (isError(res)) {
        setExpansionError(
          "Aavahana could not prepare the reading. Please try again.",
        );
      } else {
        setExpansion(res.expansion);
      }
    } catch {
      setExpansionError(
        "Aavahana could not prepare the reading. Please try again.",
      );
    } finally {
      setLoadingExpansion(false);
    }
  }, [
    byok.apiKey,
    byok.model,
    byok.provider,
    expansion,
    hasByok,
    loadingExpansion,
    suggestion.id,
  ]);

  useEffect(() => {
    setExpansion(suggestion.expansion);
    setExpansionError(null);
    setLoadingExpansion(false);
    readingRequestRef.current = null;
  }, [suggestion.id, suggestion.expansion]);

  // "Read here" is one action. Opening a reading prepares its short learning
  // note immediately instead of making the person click through a second CTA.
  useEffect(() => {
    if (
      !isOpen ||
      suggestion.kind !== "reading" ||
      expansion ||
      !hasByok ||
      readingRequestRef.current === suggestion.id
    ) {
      return;
    }
    readingRequestRef.current = suggestion.id;
    void createReading();
  }, [
    createReading,
    expansion,
    hasByok,
    isOpen,
    suggestion.id,
    suggestion.kind,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      const firstControl = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])',
      );
      (firstControl ?? dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const sourceDetails = [
    suggestion.sourceTitle,
    suggestion.author,
    suggestion.year,
  ].filter(Boolean);

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-base-content/45"
        aria-hidden
        onMouseDown={onClose}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-base-100 shadow-2xl outline-none"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-base-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid shrink-0 place-items-center rounded-xl bg-primary/10 p-2.5 text-primary">
              {isVideo ? (
                <Play className={iconSizes.md} aria-hidden />
              ) : (
                <BookOpen className={iconSizes.md} aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-balance text-lg font-semibold leading-tight text-base-content sm:text-xl"
              >
                {suggestion.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/55">
                {suggestion.effortMins != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className={iconSizes.xs} aria-hidden />
                    {suggestion.effortMins} min
                  </span>
                )}
                {suggestion.sourceDurationMins != null && isVideo && (
                  <span>{suggestion.sourceDurationMins} min video</span>
                )}
                {source && <span>{source}</span>}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            color="neutral"
            shape="square"
            size="sm"
            onClick={onClose}
            tooltip="Close"
            aria-label="Close learning content"
            iconBefore={<X className={iconSizes.sm} aria-hidden />}
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isVideo && (
            <div className="bg-neutral">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title={suggestion.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <article className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8">
            {suggestion.reason && (
              <section>
                <h3 className="text-sm font-semibold text-base-content">
                  Why Aavahana chose this
                </h3>
                <p className="mt-2 text-base leading-relaxed text-base-content/75">
                  {suggestion.reason}
                </p>
              </section>
            )}

            {suggestion.sourceNote && (
              <section className="rounded-xl bg-base-200/65 p-4">
                <h3 className="text-sm font-semibold text-base-content">
                  What to focus on
                </h3>
                <p className="mt-2 text-base leading-relaxed text-base-content/75">
                  {suggestion.sourceNote}
                </p>
              </section>
            )}

            {sourceDetails.length > 0 && (
              <p className="text-sm leading-relaxed text-base-content/60">
                <span className="font-medium text-base-content/75">
                  Confirmed source:{" "}
                </span>
                {sourceDetails.join(" · ")}
              </p>
            )}

            {expansion ? (
              <section>
                <h3 className="flex items-center gap-2 text-base font-semibold text-base-content">
                  <FileText className={iconSizes.sm} aria-hidden />
                  Aavahana learning note
                </h3>
                <div className="mt-3 whitespace-pre-wrap text-base leading-7 text-base-content/80">
                  {expansion}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-base-content/50">
                  This note explains the idea independently. It does not reproduce
                  or claim to summarize the linked publication.
                </p>
              </section>
            ) : (
              <section className="border-t border-base-200 pt-5">
                <h3 className="text-base font-semibold text-base-content">
                  {isVideo ? "Prefer to read the idea?" : "Read it inside Aavahana"}
                </h3>
                {hasByok ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                      {loadingExpansion
                        ? "Aavahana is preparing a focused explanation of this idea."
                        : "Aavahana can prepare a focused explanation of this idea using your AI key."}
                    </p>
                    {loadingExpansion ? (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-4"
                        loading
                        disabled
                      >
                        Preparing your reading
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-4"
                        onClick={createReading}
                        iconBefore={
                          <FileText className={iconSizes.sm} aria-hidden />
                        }
                      >
                        {expansionError
                          ? "Try preparing it again"
                          : "Prepare a 5-minute reading"}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-base-content/65">
                    A detailed in-app explanation needs your own AI key. You can add
                    it in{" "}
                    <Link
                      href="/aavahana/settings/ai-coach"
                      className="font-medium text-primary hover:underline"
                      onClick={onClose}
                    >
                      AI coach settings
                    </Link>
                    .
                  </p>
                )}
                {expansionError && (
                  <p role="alert" className="mt-3 text-sm text-error">
                    {expansionError}
                  </p>
                )}
              </section>
            )}

            {!isVideo && suggestion.kind === "viewing" && (
              <p className="rounded-xl bg-warning/10 p-4 text-sm leading-relaxed text-warning-content">
                This recommendation does not yet contain a verified video link, so
                Aavahana has kept you here instead of opening a search page.
              </p>
            )}
          </article>
        </div>

        {suggestion.searchUrl && (
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-base-200 px-4 py-3 sm:px-6">
            <p className="text-xs text-base-content/45">
              {returnMessage}
            </p>
            <a
              href={suggestion.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-base-content/55 hover:text-primary hover:underline"
            >
              {suggestion.verified ? "Open original source" : "Search for source"}
              <ExternalLink className={iconSizes.xs} aria-hidden />
            </a>
          </footer>
        )}
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
