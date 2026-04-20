"use client";

import { useState, useTransition } from "react";
import { registerWithSecurityData } from "./actions";
//fix
// Import your standard registration action here as well
// import { registerForEvent } from "@/app/actions/registrations";

type Props = {
  eventId: string;
  eventType: string;
  hasSecurityData: boolean;
};

export function RegisterGate({ eventId, eventType, hasSecurityData }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isIndustryVisit = eventType === "industry_visit";
  const needsData = isIndustryVisit && !hasSecurityData;

  const handleRegisterClick = () => {
    if (needsData) {
      setShowModal(true); // Pop the security gate!
    } else {
      // Normal registration flow
      // startTransition(() => registerForEvent(eventId))
      console.log("Standard registration triggered");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await registerWithSecurityData(eventId, nic, phone);
        setShowModal(false);
      } catch (err) {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        onClick={handleRegisterClick}
        disabled={isPending}
        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-bold transition-all disabled:opacity-50"
      >
        {isPending ? "Processing..." : "Register Now"}
      </button>

      {/* The Security Modal (Dialog) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl border">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-orange-600">
                Security Requirement
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                To board the bus and enter the corporate premises, you must
                provide your official NIC and Phone Number.
              </p>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  NIC Number
                </label>
                <input
                  type="text"
                  required
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  placeholder="e.g. 200112345678 or 991234567V"
                  className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07X XXX XXXX"
                  className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
