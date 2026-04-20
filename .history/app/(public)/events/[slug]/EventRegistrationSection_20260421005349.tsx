"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { registerForEvent, updateSecurityData } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  eventId: string;
  eventType: string;
  slug: string;
  isLoggedIn: boolean;
  initiallyRegistered: boolean;
  hasSecurityData: boolean;
};

export function EventRegistrationSection({
  eventId,
  eventType,
  slug,
  isLoggedIn,
  initiallyRegistered,
  hasSecurityData: initiallyHasSecurityData,
}: Props) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [hasSecurityData, setHasSecurityData] = useState(initiallyHasSecurityData);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [nicNumber, setNicNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          You&apos;re registered for this event!
        </p>
        {eventType === "industry_visit" && (
          <p className="text-xs text-orange-700/80 dark:text-orange-400/80 mb-2">
            Make sure to bring your physical National Identity Card (NIC) with you.
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => router.push("/my-events")}
        >
          View your digital wallet
        </Button>
      </div>
    );
  }

  const handleRegisterClick = () => {
    if (eventType === "industry_visit" && !hasSecurityData) {
      setShowModal(true);
    } else {
      onRegister();
    }
  };

  const onRegister = () => {
    setError(null);
    startTransition(async () => {
      // If industry visit and no security data, update profile first
      if (eventType === "industry_visit" && !hasSecurityData) {
        if (!nicNumber.trim() || !phoneNumber.trim()) {
          setError("NIC and Phone Number are required for this event.");
          return;
        }

        const updateResult = await updateSecurityData(nicNumber, phoneNumber);
        if (!updateResult.ok) {
          setError(updateResult.error === "UPDATE_FAILED" ? "Failed to save security data. Please check your inputs and try again." : updateResult.error ?? "Authentication error.");
          return;
        }
        setHasSecurityData(true);
        setShowModal(false);
      }

      // Proceed with registration
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
    <div className="flex flex-col gap-4">
      <Button onClick={handleRegisterClick} disabled={isPending} className="w-full sm:w-auto self-start">
        {isPending
          ? "Processing Registration..."
          : "Register for Event"}
      </Button>

      {/* Security Data Popup for Industry Visits */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl border relative">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-orange-600 dark:text-orange-500">
                Security Verification Required
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                For access to the corporate premises during this industry visit, you must provide your National Identity Card (NIC) and phone number before registering.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nic">NIC Number</Label>
                <Input 
                  id="nic" 
                  placeholder="e.g. 199912345678 or 991234567V" 
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  placeholder="e.g. 071 234 5678" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {error && <p className="mt-4 text-xs text-red-500 font-medium">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={onRegister}
                disabled={isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isPending ? "Validating & Registering..." : "Verify Identity & Register"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { registerForEvent, updateSecurityData } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  eventId: string;
  eventType: string;
  slug: string;
  isLoggedIn: boolean;
  initiallyRegistered: boolean;
  hasSecurityData: boolean;
};

export function EventRegistrationSection({
  eventId,
  eventType,
  slug,
  isLoggedIn,
  initiallyRegistered,
  hasSecurityData: initiallyHasSecurityData,
}: Props) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [hasSecurityData, setHasSecurityData] = useState(
    initiallyHasSecurityData,
  );
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [nicNumber, setNicNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-check-circle-2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          You&apos;re registered for this event!
        </p>
        {eventType === "industry_visit" && (
          <p className="text-xs text-orange-700/80 dark:text-orange-400/80 mb-2">
            Make sure to bring your physical National Identity Card (NIC) with
            you.
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => router.push("/my-events")}
        >
          View your digital wallet
        </Button>
      </div>
    );
  }

  const handleRegisterClick = () => {
    if (eventType === "industry_visit" && !hasSecurityData) {
      setShowModal(true);
    } else {
      onRegister();
    }
  };

  const onRegister = () => {
    setError(null);
    startTransition(async () => {
      // If industry visit and no security data, update profile first
      if (eventType === "industry_visit" && !hasSecurityData) {
        if (!nicNumber.trim() || !phoneNumber.trim()) {
          setError("NIC and Phone Number are required for this event.");
          return;
        }

        const updateResult = await updateSecurityData(nicNumber, phoneNumber);
        if (!updateResult.ok) {
          setError(
            updateResult.error === "UPDATE_FAILED"
              ? "Failed to save security data. Please check your inputs and try again."
              : (updateResult.error ?? "Authentication error."),
          );
          return;
        }
        setHasSecurityData(true);
        setShowModal(false);
      }

      // Proceed with registration
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

  if (eventType === "industry_visit" && !hasSecurityData) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20 p-4 border-orange-100 dark:border-orange-900/50">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-orange-900 dark:text-orange-500">
            Security Verification Required
          </h3>
          <p className="text-xs sm:text-sm text-orange-800/80 dark:text-orange-400">
            For access to the corporate premises during this industry visit, you
            must provide your National Identity Card (NIC) and phone number
            before registering.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nic">NIC Number</Label>
          <Input
            id="nic"
            placeholder="e.g. 199912345678 or 991234567V"
            value={nicNumber}
            onChange={(e) => setNicNumber(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. 071 234 5678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isPending}
          />
        </div>

        <Button
          onClick={onRegister}
          disabled={isPending}
          className="mt-2 w-full sm:w-auto self-start bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isPending
            ? "Validating & Securing Spot..."
            : "Verify Identity & Register"}
        </Button>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={onRegister}
        disabled={isPending}
        className="w-full sm:w-auto self-start"
      >
        {isPending ? "Processing Registration..." : "Register for Event"}
      </Button>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
