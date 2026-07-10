import { useState } from "react";
import { api } from "@/api/client";

interface Booking {
  id: string;
  name: string | null;
}

interface Props {
  booking: Booking;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelBookingModal({ booking, onClose, onCancelled }: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.delete(`/v1/Booking/${booking.id}`, {
        body: JSON.stringify({ cancellationReason: reason || null }),
        headers: { "Content-Type": "application/json" },
      });
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Cancel booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel{" "}
          <span className="font-medium text-gray-900">{booking.name ?? "this booking"}</span>?
        </p>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-sm font-medium text-gray-700">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            placeholder="Enter cancellation reason…"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cancelling…" : "Cancel booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
