import { useState } from "react";
import { api, ApiError } from "@/api/client";
import type { Session } from "@/lib/sessions";

interface Props {
  bookingId: string;
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const DURATIONS = [30, 60, 90, 120];

export default function EditSessionModal({ bookingId, session, onClose, onSaved }: Props) {
  const initialDuration = Math.round(
    (session.to.getTime() - session.from.getTime()) / 60000
  );
  // The stored per-slot price (whole-field sessions have one slot per pitch).
  const initialPrice = session.totalPrice / Math.max(1, session.slotIds.length);

  const [form, setForm] = useState({
    date: toDateInput(session.from),
    time: toTimeInput(session.from),
    duration: String(initialDuration),
    price: String(initialPrice),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const durations = DURATIONS.includes(initialDuration)
    ? DURATIONS
    : [...DURATIONS, initialDuration].sort((a, b) => a - b);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const newFrom = new Date(`${form.date}T${form.time}`);
      const newTo = new Date(newFrom.getTime() + Number(form.duration) * 60000);
      await api.put(`/v1/Booking/${bookingId}/sessions`, {
        currentFrom: session.from.toISOString(),
        currentTo: session.to.toISOString(),
        newFrom: newFrom.toISOString(),
        newTo: newTo.toISOString(),
        price: Number(form.price),
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That time is already taken on this field.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to update session");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">From</label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Duration</label>
            <select
              required
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
            >
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d % 60 === 0 ? `${d / 60} hour${d > 60 ? "s" : ""}` : `${d} min`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-fkb-mid text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-fkb-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
