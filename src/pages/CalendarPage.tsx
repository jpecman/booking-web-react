import { useState, useMemo, useRef, useEffect } from "react";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import CreateBookingModal from "@/components/CreateBookingModal";

interface Slot {
  id: string;
  from: string;
  to: string;
  pitchId: string;
  name: string | null;
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

type BookingEvent = {
  rowspan: number;
  slotNames: string[];
  fromLabel: string;
  toLabel: string;
  isBothPitches: boolean;
};

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

function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function CalendarPage() {
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
    [monday]
  );

  const flatSlots = useMemo(() => {
    if (!data) return [];
    return data.flatMap(booking =>
      (booking.slots ?? []).map(slot => ({
        id: slot.id,
        pitchId: slot.pitchId,
        name: slot.name,
        from: new Date(slot.from),
        to: new Date(slot.to),
      }))
    );
  }, [data]);

  const { dayEvents, skipSets } = useMemo(() => {
    const dayEvents = weekDays.map(day => {
      const events = new Map<number, BookingEvent>();

      const daySlots = flatSlots.filter(s => s.from.toDateString() === day.toDateString());

      const groups = new Map<string, typeof daySlots>();
      for (const slot of daySlots) {
        const key = `${slot.from.getTime()}-${slot.to.getTime()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(slot);
      }

      for (const [, slots] of groups) {
        const from = slots[0].from;
        const to = slots[0].to;
        const startMins = from.getHours() * 60 + from.getMinutes();
        const endMins = to.getHours() * 60 + to.getMinutes();

        const rowIndex = TIME_SLOTS.findIndex(t => t >= startMins);
        if (rowIndex === -1) continue;

        const endRowIndex = TIME_SLOTS.findIndex(t => t >= endMins);
        const actualEnd = endRowIndex === -1 ? TIME_SLOTS.length : endRowIndex;
        const rowspan = Math.max(1, actualEnd - rowIndex);

        const isWholeField = slots.length === 2 &&
          slots[0].pitchId !== slots[1].pitchId &&
          !!slots[0].name &&
          slots[0].name === slots[1].name;

        const slotNames = isWholeField
          ? [slots[0].name as string]
          : slots.map(s => s.name ?? "").filter(Boolean);

        events.set(rowIndex, {
          rowspan,
          slotNames,
          fromLabel: formatTime(from),
          toLabel: formatTime(to),
          isBothPitches: slots.length >= 2,
        });
      }
      return events;
    });

    const skipSets = dayEvents.map(events => {
      const skip = new Set<number>();
      for (const [rowIndex, event] of events) {
        for (let i = 1; i < event.rowspan; i++) skip.add(rowIndex + i);
      }
      return skip;
    });

    return { dayEvents, skipSets };
  }, [flatSlots, weekDays]);

  const todayStr = new Date().toDateString();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover transition-colors"
        >
          Create booking
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-lg border border-fkb-border hover:bg-fkb-bg text-gray-600 transition-colors"
          aria-label="Previous week"
        >
          &#8249;
        </button>

        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowDatePicker(p => !p)}
            className="px-4 py-2 rounded-lg border border-fkb-border hover:bg-fkb-bg text-sm font-medium text-gray-700 transition-colors min-w-48 text-center"
          >
            {formatWeekRange(monday)}
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-fkb-border rounded-lg shadow-lg p-3 z-10">
              <input
                type="date"
                autoFocus
                defaultValue={monday.toISOString().slice(0, 10)}
                onChange={handleDateSelect}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
            </div>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg border border-fkb-border hover:bg-fkb-bg text-gray-600 transition-colors"
          aria-label="Next week"
        >
          &#8250;
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-fkb-border">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-14 border-b border-r border-fkb-border bg-fkb-bg" />
              {weekDays.map((d, i) => (
                <th
                  key={i}
                  className={`px-2 py-2 text-xs font-semibold text-center border-b border-r border-fkb-border last:border-r-0 ${
                    d.toDateString() === todayStr
                      ? "bg-fkb-pale text-fkb-dark"
                      : "bg-fkb-bg text-gray-500"
                  }`}
                >
                  <div>{DAY_LABELS[i]}</div>
                  <div className="font-normal">{d.getDate()}/{d.getMonth() + 1}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((mins, rowIndex) => {
              const isHour = mins % 60 === 0;
              return (
                <tr key={mins} className={isHour ? "border-t border-fkb-border" : "border-t border-dashed border-fkb-border/50"}>
                  <td className="w-14 pr-2 text-right text-xs text-gray-400 border-r border-fkb-border align-top py-0.5">
                    {isHour ? `${Math.floor(mins / 60)}:00` : ""}
                  </td>
                  {weekDays.map((day, di) => {
                    if (skipSets[di].has(rowIndex)) return null;

                    const event = dayEvents[di].get(rowIndex);
                    const isToday = day.toDateString() === todayStr;

                    if (!event) {
                      return (
                        <td key={di} className={`h-6 border-r border-fkb-border/50 last:border-r-0 ${isToday ? "bg-fkb-pale/40" : ""}`} />
                      );
                    }

                    return (
                      <td
                        key={di}
                        rowSpan={event.rowspan}
                        className={`px-2 py-1 border-r border-fkb-border/50 last:border-r-0 align-top text-fkb-dark ${
                          event.isBothPitches ? "bg-fkb-pale" : ""
                        }`}
                        style={event.isBothPitches ? undefined : {
                          background: "linear-gradient(to right, var(--color-fkb-pale) 50%, transparent 50%)"
                        }}
                      >
                        <div className="text-xs font-semibold leading-tight truncate">
                          {event.slotNames.join(" – ")}
                        </div>
                        <div className="text-xs text-fkb-mid leading-tight">
                          {event.fromLabel} – {event.toLabel}
                        </div>
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
