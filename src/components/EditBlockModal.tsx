import { useState } from "react";
import { api, ApiError } from "@/api/client";
import { useFields } from "@/context/FieldsContext";
import type { Block } from "@/lib/sessions";

interface Props {
  block: Block;
  onClose: () => void;
  onSaved: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const DURATIONS = [30, 60, 90, 120];

export default function EditBlockModal({ block, onClose, onSaved }: Props) {
  const initialDuration = Math.round(
    (block.to.getTime() - block.from.getTime()) / 60000
  );

  const [form, setForm] = useState({
    date: toDateInput(block.from),
    time: toTimeInput(block.from),
    duration: String(initialDuration),
  });
  const [slots, setSlots] = useState(
    block.slots.map((s) => ({ id: s.id, pitchId: s.pitchId, name: s.name ?? "", price: String(s.price) }))
  );
  // A whole-field booking is edited as one session: one name and the combined price.
  const [whole, setWhole] = useState({
    name: block.slots[0]?.name ?? "",
    price: String(Math.round(block.totalPrice * 100) / 100),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { fields } = useFields();
  const pitchNames = new Map(
    (fields ?? []).flatMap((f) => f.pitches.map((p) => [p.id, p.name] as const))
  );

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setSlot = (id: string, key: "name" | "price", value: string) =>
    setSlots((list) => list.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  // Split the total equally in cents; leftover cents go to the first slots so the parts sum exactly.
  const splitPrice = (total: number, count: number) => {
    const cents = Math.round(total * 100);
    const base = Math.floor(cents / count);
    const remainder = cents - base * count;
    return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
  };

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
      const prices = splitPrice(Number(whole.price), slots.length);
      await api.patch("/v1/slots", {
        from: newFrom.toISOString(),
        to: newTo.toISOString(),
        slots: block.isWholeField
          ? slots.map((s, i) => ({
              id: s.id,
              name: whole.name.trim() || null,
              price: prices[i],
            }))
          : slots.map((s) => ({
              id: s.id,
              name: s.name.trim() || null,
              price: Number(s.price),
            })),
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
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

          {block.isWholeField ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Whole field</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={whole.name}
                  onChange={(e) => setWhole((w) => ({ ...w, name: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                />
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="Price"
                  value={whole.price}
                  onChange={(e) => setWhole((w) => ({ ...w, price: e.target.value }))}
                  className="w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                />
              </div>
            </div>
          ) : slots.map((slot) => (
            <div key={slot.id} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {pitchNames.get(slot.pitchId) ?? "Pitch"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={slot.name}
                  onChange={(e) => setSlot(slot.id, "name", e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                />
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="Price"
                  value={slot.price}
                  onChange={(e) => setSlot(slot.id, "price", e.target.value)}
                  className="w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                />
              </div>
            </div>
          ))}

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
