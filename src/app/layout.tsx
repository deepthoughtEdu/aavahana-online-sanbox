import type { Metadata } from "next";
import { Provider as JotaiProvider } from "jotai";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/lib/query/provider";
import { SandboxShell } from "@/components/sandbox/SandboxShell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Aavahana Sandbox",
  description: "Aavahana frontend sandbox",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dt-light">
      <body>
        <JotaiProvider>
          <QueryProvider>
            <Toaster position="top-right" />
            <SandboxShell>{children}</SandboxShell>
          </QueryProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
