"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAdminAuditLog } from "@/app/utils/audit";
import { createClient } from "@/lib/supabase/server";

const upsertEventSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["onsite", "virtual", "industry_visit"]),
  location: z.string().nullable(),
  meeting_url: z.string().nullable(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().nullable(),
  capacity: z.number().int().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  flyer_image_url: z.string().nullable(),
  color_code: z.string().nullable(),
});

type UpsertEventInput = z.input<typeof upsertEventSchema>;

export async function upsertEventOnServer(input: UpsertEventInput) {
  const parsed = upsertEventSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid event payload");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Not authorized");
  }

  const payload = parsed.data;

  if (payload.id) {
    const { data: existingEvent } = await supabase
      .from("events")
      .select("id, slug, title, status")
      .eq("id", payload.id)
      .single();

    const { error } = await supabase
      .from("events")
      .update({
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        location: payload.type === "onsite" ? payload.location : null,
        meeting_url: payload.type === "virtual" ? payload.meeting_url : null,
        start_at: payload.start_at,
        end_at: payload.end_at,
        capacity: payload.capacity,
        status: payload.status,
        flyer_image_url: payload.flyer_image_url,
        color_code: payload.color_code,
      })
      .eq("id", payload.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAuditLog({
      action: "EVENT_UPDATED",
      targetType: "event",
      targetId: payload.id,
      details: {
        before: existingEvent ?? null,
        after: {
          id: payload.id,
          slug: payload.slug,
          title: payload.title,
          status: payload.status,
          type: payload.type,
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath(`/events/${payload.slug}`);

    return { ok: true as const, id: payload.id };
  }

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      slug: payload.slug,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      location: payload.type === "onsite" ? payload.location : null,
      meeting_url: payload.type === "virtual" ? payload.meeting_url : null,
      start_at: payload.start_at,
      end_at: payload.end_at,
      capacity: payload.capacity,
      status: payload.status,
      flyer_image_url: payload.flyer_image_url,
      color_code: payload.color_code,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create event");
  }

  await writeAdminAuditLog({
    action: "EVENT_CREATED",
    targetType: "event",
    targetId: created.id,
    details: {
      slug: created.slug,
      title: payload.title,
      status: payload.status,
      type: payload.type,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${created.slug}`);

  return { ok: true as const, id: created.id };
}

export async function deleteEventOnServer(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Not authorized");

  const { data: existingEvent } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .single();

  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) throw new Error(error.message);

  await writeAdminAuditLog({
    action: "EVENT_DELETED",
    targetType: "event",
    targetId: eventId,
    details: {
      event_title: existingEvent?.title,
    }
  });

  revalidatePath("/admin/events");
}

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAuditLog({
      action: "EVENT_UPDATED",
      targetType: "event",
      targetId: payload.id,
      details: {
        before: existingEvent ?? null,
        after: {
          id: payload.id,
          slug: payload.slug,
          title: payload.title,
          status: payload.status,
          type: payload.type,
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath(`/events/${payload.slug}`);

    return { ok: true as const, id: payload.id };
  }

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      slug: payload.slug,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      location: payload.type === "onsite" ? payload.location : null,
      meeting_url: payload.type === "virtual" ? payload.meeting_url : null,
      start_at: payload.start_at,
      end_at: payload.end_at,
      capacity: payload.capacity,
      status: payload.status,
      flyer_image_url: payload.flyer_image_url,
      color_code: payload.color_code,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create event");
  }

  await writeAdminAuditLog({
    action: "EVENT_CREATED",
    targetType: "event",
    targetId: created.id,
    details: {
      slug: created.slug,
      title: payload.title,
      status: payload.status,
      type: payload.type,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${created.slug}`);

  return { ok: true as const, id: created.id };
}
