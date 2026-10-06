"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Dashboard", "/aavahana/dashboard"],
  ["Daily plan", "/aavahana/daily-plan"],
  ["Daily report", "/aavahana/daily-report"],
  ["Weekly plan", "/aavahana/weekly-plan"],
  ["Weekly report", "/aavahana/weekly-report"],
  ["Monthly plan", "/aavahana/monthly-plan"],
  ["Monthly report", "/aavahana/monthly-report"],
  ["Event loop", "/aavahana/event-loop"],
  ["HVT", "/aavahana/hvt"],
  ["HCD", "/aavahana/hcd"],
  ["Career runrate", "/aavahana/career-runrate"],
] as const;

export function SandboxShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/aavahana") return <>{children}</>;

  return (
    <div className="min-h-screen bg-base-200 lg:flex">
      <nav aria-label="Aavahana" className="bg-base-100 border-r border-base-300 p-4 lg:w-64 lg:min-h-screen">
        <Link href="/aavahana" className="block font-bold text-xl mb-5">Aavahana</Link>
        <div className="flex flex-wrap gap-1 lg:flex-col">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm ${pathname === href ? "bg-primary text-primary-content" : "hover:bg-base-200"}`}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
