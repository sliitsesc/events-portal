import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../../shared/EventForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEventPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, type, location, meeting_url, start_at, end_at, capacity, status, flyer_image_url, color_code",
    )
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Edit event</h2>
      <EventForm initialEvent={data} />
    </div>
  );
}

