import { EventForm } from "../shared/EventForm";

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Create event</h2>
      <EventForm />
    </div>
  );
}

