"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toggleAttendanceOnServer } from "./actions";

type Props = {
  registrationId: string;
  initialAttended: boolean;
};

export function AttendanceToggle({ registrationId, initialAttended }: Props) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      try {
        await toggleAttendanceOnServer(registrationId, !initialAttended);
        // You can manually refresh the page or rely on navigation to reflect changes.
      } catch (error) {
        console.error("Failed to update attendance", error);
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={initialAttended ? "outline" : "default"}
      disabled={isPending}
      onClick={onClick}
    >
      {initialAttended ? "Mark absent" : "Mark attended"}
    </Button>
  );
}

