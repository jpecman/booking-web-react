import { Fragment, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import { useFields } from "@/context/FieldsContext";
import { groupSessions, splitRepeated, type Session } from "@/lib/sessions";
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

// Backend BookingType, serialized as a number: 0 Unknown (error), 1 Single, 2 Repeated, 3 Camp.
const BOOKING_TYPE_UNKNOWN = 0;
const BOOKING_TYPE_REPEATED = 2;
const BOOKING_TYPE_LABELS = { 0: "Unknown", 1: "Single", 2: "Repeated", 3: "Camp" } as const;
// Outline icon paths (24×24, stroke) per booking type.
const BOOKING_TYPE_ICONS = {
  // Warning triangle
  0: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  // Calendar
  1: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  // Circular arrows
  2: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  // Tent
  3: "M3 20h18M12 4L4 20M12 4l8 16M10 20l2-5 2 5",
} as const;

interface Booking {
  id: string;
  name: string | null;
  type: 0 | 1 | 2 | 3;
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (bookingId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });

  const { fields } = useFields();
  const sessionsByBooking = new Map<string, Session[]>();
  for (const session of groupSessions(data ?? [], fields)) {
    const list = sessionsByBooking.get(session.bookingId);
    if (list) list.push(session);
    else sessionsByBooking.set(session.bookingId, [session]);
  }
  // Sessions are time-sorted, so map insertion order is bookings by earliest session.
  const bookingOrder = new Map([...sessionsByBooking.keys()].map((id, i) => [id, i]));
  const sortedBookings = (data ?? [])
    .slice()
    .sort(
      (a, b) =>
        (bookingOrder.get(a.id) ?? bookingOrder.size) -
        (bookingOrder.get(b.id) ?? bookingOrder.size)
    );
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

  const hm = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatTime = (session: Session) =>
    `${session.from.toLocaleDateString([], { weekday: "short" })} ${hm(session.from)} – ${hm(session.to)}`;

  const formatDateRange = (sessions: Session[]) => {
    const first = sessions[0].from.toLocaleDateString();
    const last = sessions[sessions.length - 1].from.toLocaleDateString();
    return first === last ? first : `${first} → ${last}`;
  };

  const pitchKey = (session: Session) => [...session.pitchIds].sort().join(",");

  const formatPrice = (price: number) => `${price.toLocaleString("cs-CZ")} Kč`;

  const sessionCount = (n: number) => `${n} ${n === 1 ? "session" : "sessions"}`;

  const dash = <span className="text-gray-400">—</span>;

  // Whole field = full circle, part of the field = half circle; the tooltip names the pitches.
  const pitchBadge = (session: Session) => {
    const label = session.isWholeField
      ? "Whole field"
      : session.pitchIds.map((id) => pitchNames.get(id) ?? "…").join(", ");
    return (
      <span
        className="inline-flex rounded-lg p-1.5 text-fkb-dark border border-fkb-dark/40 bg-fkb-pale"
        title={label}
        aria-label={label}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <circle
            cx={12}
            cy={12}
            r={9}
            fill={session.isWholeField ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          />
          {!session.isWholeField && <path d="M12 3a9 9 0 000 18z" fill="currentColor" />}
        </svg>
      </span>
    );
  };

  const editSessionButton = (session: Session) => (
    <button
      onClick={() => setEditingSession(session)}
      className="text-xs text-fkb-mid hover:text-fkb-hover font-medium"
      title="Edit session"
    >
      ✎
    </button>
  );

  // One session shown as its own row under the booking (expanded or moved).
  const sessionSubRow = (session: Session, note?: string) => (
    <tr key={session.key} className="bg-fkb-bg/50 text-gray-600">
      <td colSpan={2} />
      <td className="px-4 py-2">{pitchBadge(session)}</td>
      <td className="px-4 py-2">{session.from.toLocaleDateString()}</td>
      <td className="px-4 py-2">{formatTime(session)}</td>
      <td className="px-4 py-2">
        {note && (
          <span
            className="inline-flex rounded-lg p-1.5 text-orange-700 border border-orange-300 bg-orange-50"
            title={note}
            aria-label={note}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5" />
            </svg>
          </span>
        )}
      </td>
      <td className="px-4 py-2 whitespace-nowrap">{formatPrice(session.totalPrice)}</td>
      <td className="px-4 py-2">{editSessionButton(session)}</td>
      <td />
    </tr>
  );

  return (
    <>
      <Link to="/" className="text-sm text-fkb-mid hover:underline">
        ← Back to Overview
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-2xl font-bold">
          Bookings
          {contactName && (
            <span className="ml-3 px-3 py-0.5 rounded-lg bg-fkb-pale text-fkb-dark">
              {contactName}
            </span>
          )}
        </h1>
        <NewBookingButtons onCreated={refetch} />
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load bookings: {error.message}</p>}
      {data && data.length === 0 && <p className="text-gray-500">No bookings found.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-mid text-left text-xs font-semibold text-white uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Pitch</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-fkb-border/50">
              {sortedBookings.map((booking) => {
                const sessions = sessionsByBooking.get(booking.id) ?? [];
                const { regular, exceptions } =
                  booking.type === BOOKING_TYPE_REPEATED
                    ? splitRepeated(sessions)
                    : { regular: sessions, exceptions: [] as Session[] };
                const only = sessions.length === 1 ? sessions[0] : null;
                const isOpen = expanded.has(booking.id);
                const uniformPitch =
                  regular.length > 0 && regular.every((s) => pitchKey(s) === pitchKey(regular[0]));

                return (
                <Fragment key={booking.id}>
                <tr className="hover:bg-fkb-bg transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {booking.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span
                      className={`inline-flex rounded-lg p-1.5 ${
                        booking.type === BOOKING_TYPE_UNKNOWN
                          ? "text-fkb-danger border border-fkb-danger/40 bg-red-50"
                          : "text-fkb-dark border border-fkb-dark/40 bg-fkb-pale"
                      }`}
                      title={BOOKING_TYPE_LABELS[booking.type]}
                      aria-label={BOOKING_TYPE_LABELS[booking.type]}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BOOKING_TYPE_ICONS[booking.type]} />
                      </svg>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {uniformPitch ? pitchBadge(regular[0]) : dash}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {regular.length > 0 ? formatDateRange(regular) : dash}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {only
                      ? formatTime(only)
                      : booking.type === BOOKING_TYPE_REPEATED && regular.length > 0
                        ? formatTime(regular[0])
                        : dash}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {regular.length > 1 ? (
                      <button
                        onClick={() => toggleExpanded(booking.id)}
                        className="text-xs text-fkb-mid hover:text-fkb-hover font-medium"
                        title={isOpen ? "Hide sessions" : "Show sessions"}
                      >
                        {isOpen ? "▾" : "▸"} {sessionCount(regular.length)}
                      </button>
                    ) : regular.length === 1 ? (
                      sessionCount(1)
                    ) : (
                      dash
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {sessions.length > 0
                      ? formatPrice(sessions.reduce((sum, s) => sum + s.totalPrice, 0))
                      : dash}
                  </td>
                  <td className="px-4 py-3">{only && editSessionButton(only)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditing(booking)}
                        className="text-fkb-dark border border-fkb-dark/40 rounded-lg p-1.5 hover:bg-fkb-pale transition-colors"
                        title="Edit booking"
                        aria-label="Edit booking"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4L19.5 8.5a2.5 2.5 0 00-3.536-3.536L4.5 16.5 4 20z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCancelling(booking)}
                        className="text-fkb-danger border border-fkb-danger/40 rounded-lg p-1.5 hover:bg-red-50 transition-colors"
                        title="Cancel booking"
                        aria-label="Cancel booking"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen && regular.length > 1 && regular.map((s) => sessionSubRow(s))}
                {exceptions.map((s) => sessionSubRow(s, "moved"))}
                </Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-fkb-bg font-semibold text-gray-900">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right">
                  Total
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatPrice(
                    [...sessionsByBooking.values()]
                      .flat()
                      .reduce((sum, s) => sum + s.totalPrice, 0)
                  )}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
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
