import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function VolunteerDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  // Fetch only Published, Onsite events (no point showing virtual events to scanners)
  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_at")
    .eq("status", "published")
    .eq("type", "onsite")
    .order("start_at", { ascending: true });

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
        {events?.map((event) => (
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
              href={`/volunteer/scan/${event.id}`}
              className="w-full sm:w-auto bg-orange-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-orange-700 transition"
            >
              Open Camera Scanner
            </Link>
          </div>
        ))}

        {events?.length === 0 && (
          <div className="text-center p-8 bg-white rounded-xl border text-gray-500">
            No onsite events are currently active.
          </div>
        )}
      </div>
    </div>
  );
}
