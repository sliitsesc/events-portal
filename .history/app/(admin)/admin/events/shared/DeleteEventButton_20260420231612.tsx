"use client";

import { useTransition } from "react";
import { deleteEventOnServer } from "./actions";

export function DeleteEventButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the event "${eventTitle}"?\nThis action cannot be undone.`)) {
      startTransition(async () => {
        try {
          await deleteEventOnServer(eventId);
        } catch (error) {
          console.error(error);
          alert("Failed to delete event.");
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="ml-2 text-xs font-semibold text-red-600 hover:text-red-700 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}