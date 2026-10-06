import type { Metadata } from "next";

// Sandbox pages depend on local request fixtures and query parameters.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | Aavahana",
    default: "Aavahana",
  },
  description: "Aavahana — Daily operations, plans, reports, and growth tracking",
};

export default function AavahanaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
