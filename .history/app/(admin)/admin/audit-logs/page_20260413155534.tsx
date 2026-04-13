import { createClient } from "@/lib/supabase/server";

type AuditRow = {
  admin_id?: string;
  action_description?: string;
  created_at?: string;
};

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
      details: "-",
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
        parsed.details && Object.keys(parsed.details as object).length > 0
          ? JSON.stringify(parsed.details)
          : "-",
    };
  } catch {
    return {
      action: "LEGACY",
      targetType: "-",
      targetId: "-",
      details: raw,
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
        <p className="text-sm text-muted-foreground">No audit logs available.</p>
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
                  <tr key={`${row.admin_id ?? "unknown"}-${index}`} className="border-t">
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
                      {parsed.details}
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
