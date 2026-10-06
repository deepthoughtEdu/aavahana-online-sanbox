// src/components/aavahana/dashboard/QuickLinks.tsx
"use client";

import Link from "next/link";
import { Section } from "@/components/shared/Section";
import {
  CalendarIcon,
  ListCheckIcon,
  ClockIcon,
  ChartLineIcon,
  FlaskIcon,
  ArrowRightIcon,
} from "@/components/shared/icons";

const QUICK_LINKS = [
  {
    href: "/aavahana/daily-plan",
    icon: <CalendarIcon size="sm" />,
    label: "Daily Plan",
    description: "Plan your day — feeds your report",
  },
  {
    href: "/aavahana/weekly-plan",
    icon: <ListCheckIcon size="sm" />,
    label: "Weekly Plan",
    description: "Structure your week — deliverables and time",
  },
  {
    href: "/aavahana/event-loop",
    icon: <ClockIcon size="sm" />,
    label: "Event Loop",
    description: "Unplanned work — tracked and credited",
  },
  {
    href: "/aavahana/career-runrate",
    icon: <ChartLineIcon size="sm" />,
    label: "Career Runrate",
    description: "Your axes, scores, and projection",
  },
  {
    href: "/aavahana/hvt",
    icon: <FlaskIcon size="sm" />,
    label: "HVT Experiments",
    description: "Suggest and follow experiments",
  },
  {
    href: "/aavahana/leaves",
    icon: <CalendarIcon size="sm" />,
    label: "Leaves",
    description: "Request and track time off",
  },
] as const;

export function QuickLinks() {
  return (
    <Section>
      <Section.Header title="Quick Links" size="sm" />
      <Section.Body>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-base-300 bg-white hover:bg-base-200 hover:border-primary/15 transition-all group"
            >
              <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black">{link.label}</p>
                <p className="text-xs text-base-content/70 truncate">{link.description}</p>
              </div>
              <ArrowRightIcon size="sm" className="text-base-content/50 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </Section.Body>
    </Section>
  );
}
