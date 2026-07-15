import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";

interface ContactBookingSummary {
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    show: boolean;
  };
  bookingCount: number;
  totalPrice: number;
  earliestBookingDate: string;
  latestBookingDate: string;
  status: 0 | 1 | 2 | 3;
}

const STATUS_LABELS: Record<number, string> = {
  0: "Booked",
  1: "Invoiced",
  2: "Paid",
  3: "Cancelled",
};

const STATUS_STYLES: Record<number, string> = {
  0: "bg-gray-100 text-gray-600",
  1: "bg-amber-100 text-amber-700",
  2: "bg-fkb-pale text-fkb-dark",
  3: "bg-red-100 text-fkb-danger",
};

function getSeasonStart(date: Date): number {
  const month = date.getMonth(); // 0-indexed, Sep = 8
  return month >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

function seasonBounds(startYear: number): { from: Date; to: Date } {
  const from = new Date(startYear, 8, 1, 0, 0, 0, 0);
  const to = new Date(startYear + 1, 7, 31, 23, 59, 59, 999);
  return { from, to };
}

function formatSeasonRange(from: Date, to: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function OverviewPage() {
  const [{ from, to }, setRange] = useState(() => seasonBounds(getSeasonStart(new Date())));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const goToPrevSeason = () => setRange(({ from }) => seasonBounds(getSeasonStart(from) - 1));
  const goToNextSeason = () => setRange(({ from }) => seasonBounds(getSeasonStart(from) + 1));

  const handleFromSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split("-").map(Number);
    setRange((r) => ({ ...r, from: new Date(year, month - 1, day, 0, 0, 0, 0) }));
  };

  const handleToSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split("-").map(Number);
    setRange((r) => ({ ...r, to: new Date(year, month - 1, day, 23, 59, 59, 999) }));
  };

  useEffect(() => {
    if (!showDatePicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDatePicker]);

  const fromIso = useMemo(() => from.toISOString(), [from]);
  const toIso = useMemo(() => to.toISOString(), [to]);

  const { data, loading, error, refetch } = useFetch<ContactBookingSummary[]>(
    () => api.get(`/v1/booking-summary?From=${fromIso}&To=${toIso}`),
    [fromIso, toIso]
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Home</h1>
        <button
          onClick={refetch}
          disabled={loading}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goToPrevSeason}
          className="p-2 rounded-lg border border-fkb-border hover:bg-fkb-bg text-gray-600 transition-colors"
          aria-label="Previous season"
        >
          &#8249;
        </button>

        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowDatePicker((p) => !p)}
            className="px-4 py-2 rounded-lg border border-fkb-border hover:bg-fkb-bg text-sm font-medium text-gray-700 transition-colors min-w-48 text-center"
          >
            {formatSeasonRange(from, to)}
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-fkb-border rounded-lg shadow-lg p-3 z-10 flex gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">From</label>
                <input
                  type="date"
                  value={toDateInputValue(from)}
                  onChange={handleFromSelect}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">To</label>
                <input
                  type="date"
                  value={toDateInputValue(to)}
                  onChange={handleToSelect}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={goToNextSeason}
          className="p-2 rounded-lg border border-fkb-border hover:bg-fkb-bg text-gray-600 transition-colors"
          aria-label="Next season"
        >
          &#8250;
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load overview: {error.message}</p>}
      {data && data.length === 0 && <p className="text-gray-500">No bookings found for this period.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-bg text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Total price</th>
                <th className="px-4 py-3">Earliest booking</th>
                <th className="px-4 py-3">Latest booking</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fkb-border/50">
              {data.map((summary) => (
                <tr key={summary.contact.id} className="hover:bg-fkb-bg transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {(() => {
                      const name = `${summary.contact.firstName ?? ""} ${summary.contact.lastName ?? ""}`.trim();
                      return name ? (
                        <Link
                          to={`/bookings?contactId=${encodeURIComponent(summary.contact.id)}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`}
                          className="text-fkb-mid hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{summary.bookingCount}</td>
                  <td className="px-4 py-3 text-gray-600">{summary.totalPrice.toLocaleString("cs-CZ")} Kč</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(summary.earliestBookingDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(summary.latestBookingDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[summary.status]}`}>
                      {STATUS_LABELS[summary.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
