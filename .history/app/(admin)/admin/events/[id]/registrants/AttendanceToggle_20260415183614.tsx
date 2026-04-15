"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleAttendanceOnServer } from "./actions";

type Props = {
  registrationId: string;
  initialAttended: boolean;
};

export function AttendanceToggle({ registrationId, initialAttended }: Props) {
  const [attended, setAttended] = useState(initialAttended);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      try {
        await toggleAttendanceOnServer(registrationId, true);
        setAttended(true);
        router.refresh();
      } catch (error) {
        console.error("Failed to update attendance", error);
      }
    });
  };

  if (attended) {
    return (
      <Badge
        variant="secondary"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300"
      >
        Checked In
      </Badge>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      disabled={isPending}
      onClick={onClick}
    >
      {isPending ? "Updating..." : "Mark attended"}
    </Button>
  );
}

