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
  nic_number: string | null;
  phone_number: string | null;
};

type Props = {
  eventId: string;
  eventType: string;
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

export function LiveTable({
  eventId,
  eventType,
  eventTitle,
  eventStartAt,
  initialRows,
}: Props) {
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

  const handleExportCSV = () => {
    // 1. Build the Headers
    const headers = ["Name", "Email"];
    if (eventType === "industry_visit") {
      headers.push("NIC Number", "Phone");
    }
    headers.push(
      "Registered At",
      "Status",
      eventType === "industry_visit" ? "Boarded" : "Attended",
    );

    // 2. Map the data into CSV rows
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      // We wrap text in quotes so names with commas don't break the spreadsheet
      const rowData = [`"${row.full_name ?? ""}"`, `"${row.email ?? ""}"`];

      if (eventType === "industry_visit") {
        rowData.push(
          `"${row.nic_number ?? ""}"`,
          `"${row.phone_number ?? ""}"`,
        );
      }

      rowData.push(
        `"${formatTimestamp(row.created_at)}"`,
        `"${row.status}"`,
        `"${row.attended ? "Yes" : "No"}"`,
      );

      csvRows.push(rowData.join(","));
    });

    // 3. Create the file and trigger the download automatically
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `${eventTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Manifest.csv`,
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
          {/* 🔥 NEW EXPORT BUTTON */}
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
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
              className="mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export Manifest (CSV)
          </button>

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
                {eventType === "industry_visit" && (
                  <>
                    <th className="px-4 py-2 font-medium text-orange-700 dark:text-orange-400">
                      NIC Number
                    </th>
                    <th className="px-4 py-2 font-medium text-orange-700 dark:text-orange-400">
                      Phone
                    </th>
                  </>
                )}
                <th className="px-4 py-2 font-medium">Registered at</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">
                  {eventType === "industry_visit" ? "Boarded Bus" : "Attended"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-2 align-top">
                    {row.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span className="text-xs text-muted-foreground">
                      {row.email ?? "—"}
                    </span>
                  </td>
                  {eventType === "industry_visit" && (
                    <>
                      <td className="px-4 py-2 align-top font-mono text-xs">
                        {row.nic_number ?? "Not Provided"}
                      </td>
                      <td className="px-4 py-2 align-top font-mono text-xs">
                        {row.phone_number ?? "—"}
                      </td>
                    </>
                  )}
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
