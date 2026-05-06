import { useState } from "react";
import CreateBookingModal from "@/components/CreateBookingModal";

export default function OverviewPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create booking
        </button>
      </div>

      {showModal && (
        <CreateBookingModal
          onClose={() => setShowModal(false)}
          onCreated={() => console.log("booking created")}
        />
      )}
    </>
  );
}
