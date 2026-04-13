import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventScanPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, type")
    .eq("id", params.id)
    .single();

  if (error || !event) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          QR Check-in · {event.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {event.type === "onsite"
            ? "Use this page to check in attendees for on-site events."
            : "This is a virtual event. QR check-in is not required."}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Scanner UI is not wired yet. For now, manage attendance manually from the
        registrants page.
      </div>

      <div>
        <Link
          href={`/admin/events/${event.id}/registrants`}
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Go to registrants
        </Link>
      </div>
    </div>
  );
}
