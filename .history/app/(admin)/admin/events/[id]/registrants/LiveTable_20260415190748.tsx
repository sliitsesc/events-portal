"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceToggle } from "./AttendanceToggle";

type LiveRegistrantRow = {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  attended: boolean;
  full_name: string | null;
  email: string | null;
};

type Props = {
  eventId: string;
  eventTitle: string;
  eventStartAt: string;
  initialRows: LiveRegistrantRow[];
};

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function LiveTable({ eventId, eventTitle, eventStartAt, initialRows }: Props) {
  const [rows, setRows] = useState<LiveRegistrantRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`registrants-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_registrations",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const next = payload.new as {
            id?: unknown;
            attended?: unknown;
            status?: unknown;
          };

          if (typeof next.id !== "string") {
            return;
          }

          setRows((prevRows) =>
            prevRows.map((row) =>
              row.id === next.id
                ? {
                    ...row,
                    attended:
                      typeof next.attended === "boolean"
                        ? next.attended
                        : row.attended,
                    status:
                      typeof next.status === "string"
                        ? next.status
                        : row.status,
                  }
                : row,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId]);

  const registrantCount = rows.length;
  const attendedCount = useMemo(
    () => rows.filter((row) => row.attended).length,
    [rows],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Registrants · {eventTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatTimestamp(eventStartAt)}
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Card className="w-full sm:w-fit sm:min-w-[150px]">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Registrant Count
              </p>
              <p className="mt-1 text-2xl font-bold leading-none">
                {registrantCount}
              </p>
            </CardContent>
          </Card>

          <Card className="w-full sm:w-fit sm:min-w-[150px]">
            <CardContent className="p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Attended Count
              </p>
              <p className="mt-1 text-2xl font-bold leading-none">
                {attendedCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No registrations yet for this event.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Registered at</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Attended</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-2 align-top">{row.full_name ?? "—"}</td>
                  <td className="px-4 py-2 align-top">
                    <span className="text-xs text-muted-foreground">
                      {row.email ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(row.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top text-xs capitalize">
                    {row.status}
                  </td>
                  <td className="px-4 py-2 align-top text-xs">
                    <AttendanceToggle
                      registrationId={row.id}
                      initialAttended={row.attended}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
