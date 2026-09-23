import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import { useFields } from "@/context/FieldsContext";
import { groupSessions, type Session } from "@/lib/sessions";
import NewBookingButtons from "@/components/NewBookingButtons";
import CancelBookingModal from "@/components/CancelBookingModal";
import EditBookingModal from "@/components/EditBookingModal";
import EditSessionModal from "@/components/EditSessionModal";

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
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const hasContext = !!contactId && !!from && !!to;

  const { data, loading, error, refetch } = useFetch<Booking[]>(
    () =>
      api.get(
        `/v1/bookings?from=${encodeURIComponent(from!)}&to=${encodeURIComponent(to!)}&contactId=${encodeURIComponent(contactId!)}`
      ),
    [contactId, from, to],
    { enabled: hasContext }
  );

  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const { fields } = useFields();
  const sessionsByBooking = new Map<string, Session[]>();
  for (const session of groupSessions(data ?? [], fields)) {
    const list = sessionsByBooking.get(session.bookingId);
    if (list) list.push(session);
    else sessionsByBooking.set(session.bookingId, [session]);
  }
  const pitchNames = new Map(
    (fields ?? []).flatMap((f) => f.pitches.map((p) => [p.id, p.name] as const))
  );

  if (!hasContext) {
    return (
      <div className="text-gray-500">
        No contact selected — go to{" "}
        <Link to="/" className="text-fkb-mid hover:underline">
          Overview
        </Link>{" "}
        and click a contact name.
      </div>
    );
  }

  const contactName = data?.[0]?.contact
    ? `${data[0].contact.firstName ?? ""} ${data[0].contact.lastName ?? ""}`.trim()
    : null;

  const formatSessionTime = (from: Date, to: Date) =>
    `${from.toLocaleDateString()} ${from.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${to.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <>
      <Link to="/" className="text-sm text-fkb-mid hover:underline">
        ← Back to Overview
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-2xl font-bold">
          Bookings{contactName ? ` — ${contactName}` : ""}
        </h1>
        <NewBookingButtons onCreated={refetch} />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load bookings: {error.message}</p>}
      {data && data.length === 0 && <p className="text-gray-500">No bookings found.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-bg text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-fkb-border/50">
              {data.map((booking) => (
                <tr key={booking.id} className="hover:bg-fkb-bg transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {booking.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.contact
                      ? `${booking.contact.firstName ?? ""} ${booking.contact.lastName ?? ""}`.trim()
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(sessionsByBooking.get(booking.id)?.length ?? 0) > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {sessionsByBooking.get(booking.id)!.map((session) => (
                          <span key={session.key} className="flex items-center gap-2">
                            {formatSessionTime(session.from, session.to)}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                session.isWholeField
                                  ? "bg-fkb-pale text-fkb-dark"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {session.isWholeField
                                ? "Whole field"
                                : session.pitchIds
                                    .map((id) => pitchNames.get(id) ?? "…")
                                    .join(", ")}
                            </span>
                            <button
                              onClick={() => setEditingSession(session)}
                              className="text-xs text-fkb-mid hover:text-fkb-hover font-medium"
                              title="Edit session"
                            >
                              ✎
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditing(booking)}
                        className="text-xs font-medium text-fkb-dark border border-fkb-dark/40 rounded-lg px-3 py-1.5 hover:bg-fkb-pale transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setCancelling(booking)}
                        className="text-xs font-medium text-fkb-danger border border-fkb-danger/40 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelling && (
        <CancelBookingModal
          booking={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={refetch}
        />
      )}

      {editing && (
        <EditBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={refetch}
        />
      )}

      {editingSession && (
        <EditSessionModal
          bookingId={editingSession.bookingId}
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={refetch}
        />
      )}
    </>
  );
}
