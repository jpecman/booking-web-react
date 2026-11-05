import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useContacts } from "@/context/ContactsContext";
import { useFields } from "@/context/FieldsContext";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  // Monday of the week to pre-fill sessions for (e.g. the Calendar's selected week).
  weekStart?: Date;
}

interface Session {
  key: string;
  date: string;
  time: string;
  duration: string;
  price: string;
}

// Local date, not UTC: toISOString() would shift local midnight to the previous day.
const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// The Thursday of the given week, or the next Thursday from today.
function getThursday(weekStart?: Date) {
  if (weekStart) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 3);
    return d;
  }
  const d = new Date();
  const diff = (4 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function defaultSessions(weekStart?: Date): Session[] {
  const thu = getThursday(weekStart);
  const fri = new Date(thu);
  fri.setDate(fri.getDate() + 1);
  const sat = new Date(thu);
  sat.setDate(sat.getDate() + 2);
  const sun = new Date(thu);
  sun.setDate(sun.getDate() + 3);

  const template: { date: Date; time: string }[] = [
    { date: thu, time: "18:00" },
    { date: fri, time: "09:00" },
    { date: fri, time: "14:00" },
    { date: sat, time: "09:00" },
    { date: sat, time: "14:00" },
    { date: sun, time: "09:00" },
  ];

  return template.map(({ date, time }) => ({
    key: crypto.randomUUID(),
    date: toDateInput(date),
    time,
    duration: "90",
    price: "1000",
  }));
}

export default function CreateCampBookingModal({ onClose, onCreated, weekStart }: Props) {
  const { contacts } = useContacts();
  const { fields } = useFields();

  const [form, setForm] = useState({
    name: "",
    contactId: "",
    fieldId: "",
    isWholeField: true,
    repeatWeekly: false,
    endDate: "",
  });
  const [sessions, setSessions] = useState<Session[]>(() => defaultSessions(weekStart));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (fields?.length === 1) setForm((f) => ({ ...f, fieldId: fields[0].id }));
  }, [fields]);

  const setSession = <K extends keyof Session>(key: string, field: K, value: Session[K]) =>
    setSessions((s) => s.map((session) => (session.key === key ? { ...session, [field]: value } : session)));

  const addSession = () =>
    setSessions((s) => [
      ...s,
      {
        key: crypto.randomUUID(),
        date: toDateInput(weekStart ? getThursday(weekStart) : new Date()),
        time: "09:00",
        duration: "90",
        price: "1000",
      },
    ]);

  const removeSession = (key: string) => setSessions((s) => s.filter((session) => session.key !== key));

  const lastSessionDate = sessions.reduce((max, s) => (s.date > max ? s.date : max), "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (sessions.length === 0) {
      setError("Add at least one slot");
      return;
    }
    if (form.repeatWeekly && form.endDate < lastSessionDate) {
      setError("End date must be after the last slot");
      return;
    }
    setLoading(true);
    try {
      await api.post("/v1/bookings/camp", {
        name: form.name || undefined,
        isWholeField: form.isWholeField,
        contactId: form.contactId,
        fieldId: form.fieldId,
        sessions: sessions.map((s) => ({
          from: new Date(`${s.date}T${s.time}`).toISOString(),
          duration: Number(s.duration),
          price: Number(s.price),
        })),
        endDate: form.repeatWeekly ? new Date(`${form.endDate}T23:59:59`).toISOString() : undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create camp booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New camp booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Contact</label>
            <select
              required
              value={form.contactId}
              onChange={(e) => set("contactId", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
            >
              <option value="">Select contact…</option>
              {contacts?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Field</label>
            <select
              required
              value={form.fieldId}
              onChange={(e) => set("fieldId", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
            >
              <option value="">Select field…</option>
              {fields?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isWholeField}
              onChange={(e) => set("isWholeField", e.target.checked)}
              className="w-4 h-4 accent-fkb-mid"
            />
            Whole field
          </label>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Slots</label>
            <div className="flex flex-col gap-2">
              {sessions.map((session) => (
                <div key={session.key} className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={session.date}
                    onChange={(e) => setSession(session.key, "date", e.target.value)}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                  />
                  <input
                    type="time"
                    required
                    value={session.time}
                    onChange={(e) => setSession(session.key, "time", e.target.value)}
                    className="w-24 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                  />
                  <select
                    required
                    value={session.duration}
                    onChange={(e) => setSession(session.key, "duration", e.target.value)}
                    className="w-28 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                  >
                    <option value="30">30 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="Price"
                    value={session.price}
                    onChange={(e) => setSession(session.key, "price", e.target.value)}
                    className="w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                  />
                  <button
                    type="button"
                    onClick={() => removeSession(session.key)}
                    className="text-gray-400 hover:text-fkb-danger px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSession}
              className="self-start bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add slot
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.repeatWeekly}
              onChange={(e) => set("repeatWeekly", e.target.checked)}
              className="w-4 h-4 accent-fkb-mid"
            />
            Repeat weekly
          </label>

          {form.repeatWeekly && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Until</label>
              <input
                type="date"
                required
                min={lastSessionDate || undefined}
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-fkb-mid text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-fkb-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
