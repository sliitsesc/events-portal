"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { registerForEvent } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
  isLoggedIn: boolean;
  initiallyRegistered: boolean;
};

export function EventRegistrationSection({
  slug,
  isLoggedIn,
  initiallyRegistered,
}: Props) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          You need an account to register for this event.
        </p>
        <Button
          onClick={() =>
            router.push(
              `/auth/login?redirect=/events/${encodeURIComponent(slug)}`,
            )
          }
        >
          Login to register
        </Button>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-emerald-600 dark:text-emerald-300">
          You&apos;re registered for this event.
        </p>
        {ticketCode && (
          <p className="text-xs text-muted-foreground">
            Ticket code: <span className="font-medium">{ticketCode}</span>
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => router.push("/my-events")}
        >
          Open digital wallet
        </Button>
      </div>
    );
  }

  const onRegister = () => {
    setError(null);
    startTransition(async () => {
      const result = await registerForEvent(slug);

      if (result.ok) {
        setTicketCode(result.ticket.ticketCode);
        setRegistered(true);
        return;
      }

      switch (result.error) {
        case "EVENT_FULL":
          setError("This event is already full.");
          break;
        case "ALREADY_REGISTERED":
          setRegistered(true);
          break;
        case "NOT_AUTHENTICATED":
          setError("Please log in to register.");
          break;
        default:
          setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <RegisterGate
        eventId={eventId}
        eventType={eventType}
        hasSecurityData={hasSecurityData}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
