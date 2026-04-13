"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertEventOnServer } from "./actions";

type EditableEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "onsite" | "virtual";
  location: string | null;
  meeting_url: string | null;
  start_at: string;
  end_at: string | null;
  capacity: number | null;
  status: "draft" | "published" | "archived";
  flyer_image_url: string | null;
  color_code: string | null;
};

type EventFormProps = {
  initialEvent?: EditableEvent;
};

export function EventForm({ initialEvent }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(
    initialEvent?.description ?? "",
  );
  const [type, setType] = useState<"onsite" | "virtual">(
    initialEvent?.type ?? "onsite",
  );
  const [location, setLocation] = useState(initialEvent?.location ?? "");
  const [meetingUrl, setMeetingUrl] = useState(initialEvent?.meeting_url ?? "");
  const [startAt, setStartAt] = useState(
    initialEvent?.start_at?.slice(0, 16) ?? "",
  );
  const [endAt, setEndAt] = useState(initialEvent?.end_at?.slice(0, 16) ?? "");
  const [capacity, setCapacity] = useState(
    initialEvent?.capacity?.toString() ?? "",
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialEvent?.status ?? "draft",
  );
  const [colorCode, setColorCode] = useState(initialEvent?.color_code ?? "");
  const [flyerUrl, setFlyerUrl] = useState(initialEvent?.flyer_image_url ?? "");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const slug =
          initialEvent?.slug ??
          title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const payload = {
          slug,
          title,
          description,
          type,
          location: type === "onsite" ? location || null : null,
          meeting_url: type === "virtual" ? meetingUrl || null : null,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          end_at: endAt ? new Date(endAt).toISOString() : null,
          capacity: capacity ? parseInt(capacity, 10) : null,
          status,
          flyer_image_url: flyerUrl || null,
          color_code: colorCode || null,
        };

        if (!payload.title || !payload.description || !payload.start_at) {
          setError("Title, description and start time are required.");
          return;
        }

        await upsertEventOnServer({
          ...payload,
          id: initialEvent?.id,
          start_at: payload.start_at,
          end_at: payload.end_at,
        });

        router.push("/admin/events");
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("Something went wrong.");
      }
    });
  };

  const onFlyerChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("event-flyers")
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      setError("Failed to upload flyer image.");
      return;
    }

    const { data } = supabase.storage
      .from("event-flyers")
      .getPublicUrl(filePath);

    setFlyerUrl(data.publicUrl);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the event..."
            className="flex w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Type</label>
          <select
            title="Event type"
            className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as "onsite" | "virtual")}
          >
            <option value="onsite">Onsite</option>
            <option value="virtual">Virtual</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {type === "onsite" ? "Location" : "Meeting URL"}
          </label>
          {type === "onsite" ? (
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Building / room"
            />
          ) : (
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://..."
            />
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Start</label>
          <Input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">End</label>
          <Input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Capacity</label>
          <Input
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Status</label>
          <select
            title="Event status"
            className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "draft" | "published" | "archived")
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Event color</label>
          <Input
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            placeholder="#4F46E5"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium">Flyer image</label>
          <Input type="file" accept="image/*" onChange={onFlyerChange} />
          {flyerUrl && (
            <div className="mt-2">
              <img
                src={flyerUrl}
                alt="Flyer preview"
                className="max-h-48 rounded-md border object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save event"}
      </Button>
    </form>
  );
}
