import { createClient } from "@/lib/supabase/server";

type AuditRow = {
  admin_id?: string;
  action_description?: string;
  created_at?: string;
};

function formatDetailKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function formatDateTime(iso: string | undefined) {
  if (!iso) return "-";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function parseActionDescription(raw: string | undefined) {
  if (!raw) {
    return {
      action: "UNKNOWN",
      targetType: "-",
      targetId: "-",
      details: null as Record<string, unknown> | null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      action?: string;
      targetType?: string;
      targetId?: string | null;
      details?: unknown;
    };

    return {
      action: parsed.action ?? "UNKNOWN",
      targetType: parsed.targetType ?? "-",
      targetId: parsed.targetId ?? "-",
      details:
        parsed.details &&
        typeof parsed.details === "object" &&
        Object.keys(parsed.details as object).length > 0
          ? (parsed.details as Record<string, unknown>)
          : null,
    };
  } catch {
    return {
      action: "LEGACY",
      targetType: "-",
      targetId: "-",
      details: { message: raw } as Record<string, unknown>,
    };
  }
}

export default async function AuditLogsPage() {
  const supabase = await createClient();

  let query = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (query.error) {
    query = await supabase.from("audit_logs").select("*").limit(100);
  }

  const rows = (query.data ?? []) as AuditRow[];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">
          Security activity trail for admin-side actions.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No audit logs available.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">Admin ID</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const parsed = parseActionDescription(row.action_description);

                return (
                  <tr
                    key={`${row.admin_id ?? "unknown"}-${index}`}
                    className="border-t"
                  >
                    <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-4 py-2 align-top">{parsed.action}</td>
                    <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                      {parsed.targetType}
                      {parsed.targetId !== "-" ? ` · ${parsed.targetId}` : ""}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                      {row.admin_id ?? "-"}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-muted-foreground break-all">
                      {!parsed.details ? (
                        "-"
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(parsed.details).map(
                            ([key, value]) => (
                              <div key={key} className="grid gap-0.5">
                                <span className="font-medium text-foreground/80">
                                  {formatDetailKey(key)}
                                </span>
                                <span>{formatDetailValue(value)}</span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
