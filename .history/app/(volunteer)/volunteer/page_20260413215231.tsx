import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type VolunteerEventRow = {
  id: string;
  title: string;
  start_at: string;
};

function getTodayBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export default async function VolunteerDashboard() {
  const supabase = await createClient();
  const { startIso, endIso } = getTodayBounds();

  // Fetch only Published, Onsite events (no point showing virtual events to scanners)
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, start_at")
    .eq("status", "published")
    .eq("type", "onsite")
    .gte("start_at", startIso)
    .lte("start_at", endIso)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error loading volunteer events", error);
  }

  const rows = (events ?? []) as VolunteerEventRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Select Event to Scan
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose the event you are assigned to. Ensure your camera permissions
          are enabled.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((event) => (
          <div
            key={event.id}
            className="bg-white p-6 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {event.title}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(event.start_at).toLocaleDateString()}
              </p>
            </div>

            <Link
              href={`/volunteer/events/${event.id}/scan`}
              className="w-full sm:w-auto bg-orange-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-orange-700 transition"
            >
              Open Scanner
            </Link>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center p-8 bg-white rounded-xl border text-gray-500">
            No onsite events are scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
}
