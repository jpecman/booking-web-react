import { useState } from "react";
import CreateBookingModal from "@/components/CreateBookingModal";
import CreateCampBookingModal from "@/components/CreateCampBookingModal";

interface Props {
  onCreated: () => void;
}

export default function NewBookingButtons({ onCreated }: Props) {
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
        <CreateBookingModal onClose={() => setCreating(false)} onCreated={onCreated} />
      )}

      {creatingCamp && (
        <CreateCampBookingModal onClose={() => setCreatingCamp(false)} onCreated={onCreated} />
      )}
    </>
  );
}
