import { useState } from "react";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import CreateBookingModal from "@/components/CreateBookingModal";

interface Slot {
  id: string;
  name: string | null;
  from: string;
  to: string;
  price: number;
  pitchId: string;
}

interface Booking {
  id: string;
  name: string | null;
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  slots: Slot[];
}

export default function BookingsPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<Booking[]>(
    () => api.get("/v1/Booking?From=2026-01-01T00:00:00.000Z&To=2026-12-31T23:59:59.999Z"),
    [],
    { enabled: !!user }
  );

  const [creating, setCreating] = useState(false);

  const formatSlotTime = (from: string, to: string) => {
    const f = new Date(from);
    const t = new Date(to);
    return `${f.toLocaleDateString()} ${f.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCreating(true)}
            disabled={!user}
            className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            New booking
          </button>
          <button
            onClick={refetch}
            disabled={!user || loading}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading…" : "Reload"}
          </button>
        </div>
      </div>

      {!user && <p className="text-gray-500">Sign in to view your bookings.</p>}
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load bookings: {error.message}</p>}
      {data && data.length === 0 && <p className="text-gray-500">No bookings found.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Slots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {booking.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.contact
                      ? `${booking.contact.firstName ?? ""} ${booking.contact.lastName ?? ""}`.trim()
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.slots?.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {booking.slots.map((slot) => (
                          <span key={slot.id}>{formatSlotTime(slot.from, slot.to)}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateBookingModal
          onClose={() => setCreating(false)}
          onCreated={refetch}
        />
      )}
    </>
  );
}
