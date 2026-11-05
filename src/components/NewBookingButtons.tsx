import { useState } from "react";
import CreateBookingModal from "@/components/CreateBookingModal";
import CreateCampBookingModal from "@/components/CreateCampBookingModal";

interface Props {
  onCreated: () => void;
  // Monday of the week the new booking should default to (e.g. the Calendar's selected week).
  weekStart?: Date;
}

export default function NewBookingButtons({ onCreated, weekStart }: Props) {
  const [creating, setCreating] = useState(false);
  const [creatingCamp, setCreatingCamp] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setCreating(true)}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          New booking
        </button>
        <button
          onClick={() => setCreatingCamp(true)}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          New camp booking
        </button>
      </div>

      {creating && (
        <CreateBookingModal onClose={() => setCreating(false)} onCreated={onCreated} weekStart={weekStart} />
      )}

      {creatingCamp && (
        <CreateCampBookingModal onClose={() => setCreatingCamp(false)} onCreated={onCreated} weekStart={weekStart} />
      )}
    </>
  );
}
