import "server-only";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

type AuditDetails = Record<string, unknown>;

type AdminAuditInput = {
  action: string;
  targetType: "event" | "registration" | "profile" | "auth" | "other";
  targetId?: string;
  details?: AuditDetails;
};

type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
};

function safeJsonStringify(input: unknown): string {
  try {
    return JSON.stringify(input);
  } catch {
    return JSON.stringify({
      action: "AUDIT_SERIALIZATION_FAILED",
      at: new Date().toISOString(),
    });
  }
}

async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
  };
}

export async function writeAdminAuditLog(input: AdminAuditInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Audit failed: user session missing");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Audit failed: only admins can write audit records");
  }

  const request = await getRequestMeta();

  const actionDescription = safeJsonStringify({
    at: new Date().toISOString(),
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    details: input.details ?? {},
    request,
  });

  const { error } = await supabase.from("audit_logs").insert({
    admin_id: user.id,
    action_description: actionDescription,
  });

  if (error) {
    throw new Error(`Audit write failed: ${error.message}`);
  }
}