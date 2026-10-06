"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import {
  CheckCircleIcon,
  ArrowRightIcon,
} from "@/components/shared/icons";

interface Props {
  weekLabel: string;
  chipCount: number;
}

export function PostSubmitView({ weekLabel, chipCount }: Props) {
  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Weekly Plan" subtitle={weekLabel}>
        <Badge label="Filed" variant="success" size="sm" />
      </PageHeader>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <Section>
          <Section.Header
            icon={<CheckCircleIcon size="sm" />}
            title="Your week is set"
            subtitle={`${chipCount} ${chipCount === 1 ? "item" : "items"} filed for ${weekLabel}`}
            size="md"
          />
          <Section.Body>
            <p className="text-sm text-neutral leading-relaxed">
              The daily plan will pull today&rsquo;s picks at sunrise. Last
              week&rsquo;s reflection has been carried into the team trail —
              your manager will see the trailing pattern beside your name.
            </p>
            <div className="mt-4">
              <Link href="/aavahana/daily-plan" passHref>
                <Button
                  color="primary"
                  size="md"
                  iconAfter={<ArrowRightIcon size="sm" />}
                >
                  Open today&rsquo;s daily plan
                </Button>
              </Link>
            </div>
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
