// components/report/daily/LoggedOutSection.tsx
"use client";

import { Button } from "@/components/shared/Button";

import { cn } from "@/utils";
import { borderRadius } from "@/utils/shared/design.utils";
import { LogoutIcon } from "@/components/shared/icons";
import { Section } from "@/components/shared/Section";
import { useAlert } from "@/lib/hooks/shared/use-alert";

interface LoggedOutSectionProps {
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function LoggedOutSection({
  onLogout,
  isLoggingOut,
}: LoggedOutSectionProps) {
  const alert = useAlert();

  const handleLogout = async () => {
    const result = await alert.confirm({
      title: "End Work Session?",
      message:
        "Are you sure you want to log out now? Your progress will be saved.",
      confirmText: isLoggingOut ? "Saving..." : "Yes, Logout",
      cancelText: "No",
      showCancel: true,
    });
    if (result.isConfirmed) {
      onLogout();
    }
  };

  return (
    <>
      <Section className={cn("bg-base-100", borderRadius.lg)}>
        <Section.Header
          title="End your session"
          size="sm"
          subtitle="Log out to securely close today's workspace."
          icon={<LogoutIcon size="sm" />}
        >
          <Button
            color="warning"
            variant="soft"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Section.Header>
      </Section>
    </>
  );
}
