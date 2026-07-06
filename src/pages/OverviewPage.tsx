import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import CreateBookingModal from "@/components/CreateBookingModal";

interface Slot {
  id: string;
  from: string;
  to: string;
}

interface Booking {
  id: string;
  name: string | null;
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  slots: Slot[] | null;
}

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => 480 + i * 30); // 8:00–21:30
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(from?: Date): Date {
  const now = from ?? new Date();
  const day = now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(mon: Date): string {
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)} ${sun.getFullYear()}`;
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [monday, setMonday] = useState(getMonday);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const goToPrevWeek = () => setMonday(m => { const d = new Date(m); d.setDate(m.getDate() - 7); return d; });
  const goToNextWeek = () => setMonday(m => { const d = new Date(m); d.setDate(m.getDate() + 7); return d; });

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split("-").map(Number);
    setMonday(getMonday(new Date(year, month - 1, day)));
    setShowDatePicker(false);
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

  const fetchTo = useMemo(() => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + 7);
    return d.toISOString();
  }, [monday]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    }), [monday]);

  const { data, refetch } = useFetch<Booking[]>(
    () => api.get(`/v1/Booking?From=${monday.toISOString()}&To=${fetchTo}`),
    [monday],
    { enabled: !!user }
  );

  const flatSlots = useMemo(() => {
    if (!data) return [];
    return data.flatMap(booking =>
      (booking.slots ?? []).map(slot => ({
        id: slot.id,
        from: new Date(slot.from),
        to: new Date(slot.to),
        label: (booking.name ??
          `${booking.contact?.firstName ?? ""} ${booking.contact?.lastName ?? ""}`.trim()) || "—",
      }))
    );
  }, [data]);

  const getCellInfo = useCallback((day: Date, startMins: number) => {
    const cellStart = new Date(day);
    cellStart.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
    const slot = flatSlots.find(s => cellStart >= s.from && cellStart < s.to);
    if (!slot) return null;
    const prevStart = new Date(cellStart.getTime() - 30 * 60 * 1000);
    return { ...slot, isFirst: prevStart < slot.from };
  }, [flatSlots]);

  const todayStr = new Date().toDateString();

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

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          aria-label="Previous week"
        >
          &#8249;
        </button>

        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowDatePicker(p => !p)}
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors min-w-48 text-center"
          >
            {formatWeekRange(monday)}
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
              <input
                type="date"
                autoFocus
                defaultValue={monday.toISOString().slice(0, 10)}
                onChange={handleDateSelect}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          aria-label="Next week"
        >
          &#8250;
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-14 border-b border-r border-gray-200 bg-gray-50" />
              {weekDays.map((d, i) => (
                <th
                  key={i}
                  className={`px-2 py-2 text-xs font-semibold text-center border-b border-r border-gray-200 last:border-r-0 ${
                    d.toDateString() === todayStr
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <div>{DAY_LABELS[i]}</div>
                  <div className="font-normal">{d.getDate()}/{d.getMonth() + 1}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((mins) => {
              const isHour = mins % 60 === 0;
              return (
                <tr key={mins} className={isHour ? "border-t border-gray-200" : "border-t border-dashed border-gray-100"}>
                  <td className="w-14 pr-2 text-right text-xs text-gray-400 border-r border-gray-200 align-top py-0.5">
                    {isHour ? `${Math.floor(mins / 60)}:00` : ""}
                  </td>
                  {weekDays.map((day, di) => {
                    const cell = getCellInfo(day, mins);
                    const isToday = day.toDateString() === todayStr;
                    return (
                      <td
                        key={di}
                        className={`h-6 px-1 border-r border-gray-100 last:border-r-0 align-top overflow-hidden ${
                          cell ? "bg-indigo-100" : isToday ? "bg-indigo-50/40" : ""
                        }`}
                      >
                        {cell?.isFirst && (
                          <span className="text-xs font-medium text-indigo-800 truncate block leading-tight">
                            {cell.label}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateBookingModal
          onClose={() => setShowModal(false)}
          onCreated={refetch}
        />
      )}
    </>
  );
}
