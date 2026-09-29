import { useState, useMemo, useRef, useEffect } from "react";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import { useFields } from "@/context/FieldsContext";
import { groupBlocks, type Block } from "@/lib/sessions";
import NewBookingButtons from "@/components/NewBookingButtons";
import EditBlockModal from "@/components/EditBlockModal";

interface Slot {
  id: string;
  from: string;
  to: string;
  pitchId: string;
  bookingId: string;
  name: string | null;
  price: number;
  status: number;
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

type SessionEntry = {
  block: Block;
  label: string | null;
  fromLabel: string;
  toLabel: string;
  isFull: boolean;
};

type CalendarCell = {
  rowspan: number;
  entries: SessionEntry[];
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

// Whole field → the booking's name; halves → both names, in pitchId order.
function blockLabel(block: Block): string | null {
  if (block.isWholeField) return block.slots[0].name;
  return block.slots.map(s => s.name).filter(Boolean).join(" - ") || null;
}

export default function CalendarPage() {
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
    () => api.get(`/v1/bookings?from=${monday.toISOString()}&to=${fetchTo}`),
    [monday]
  );

  const { fields } = useFields();

  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const sessions = useMemo(() => groupBlocks(data ?? [], fields), [data, fields]);

  const pitchCountByField = useMemo(
    () => new Map((fields ?? []).map(f => [f.id, f.pitches.length])),
    [fields]
  );

  const { dayEvents, skipSets } = useMemo(() => {
    const dayEvents = weekDays.map(day => {
      const cells = new Map<number, CalendarCell>();

      const daySessions = sessions.filter(s => s.from.toDateString() === day.toDateString());

      for (const session of daySessions) {
        const startMins = session.from.getHours() * 60 + session.from.getMinutes();
        const endMins = session.to.getHours() * 60 + session.to.getMinutes();

        const rowIndex = TIME_SLOTS.findIndex(t => t >= startMins);
        if (rowIndex === -1) continue;

        const endRowIndex = TIME_SLOTS.findIndex(t => t >= endMins);
        const actualEnd = endRowIndex === -1 ? TIME_SLOTS.length : endRowIndex;
        const rowspan = Math.max(1, actualEnd - rowIndex);

        const occupiedPitches = new Set(session.slots.map(s => s.pitchId)).size;
        const entry: SessionEntry = {
          block: session,
          label: blockLabel(session),
          fromLabel: formatTime(session.from),
          toLabel: formatTime(session.to),
          isFull: session.isWholeField || occupiedPitches === pitchCountByField.get(session.fieldId),
        };

        // Blocks of different fields can start in the same row; they share
        // the cell but keep their own label and times.
        const existing = cells.get(rowIndex);
        if (existing) {
          existing.entries.push(entry);
          existing.rowspan = Math.max(existing.rowspan, rowspan);
        } else {
          cells.set(rowIndex, { rowspan, entries: [entry] });
        }
      }
      return cells;
    });

    const skipSets = dayEvents.map(events => {
      const skip = new Set<number>();
      for (const [rowIndex, event] of events) {
        for (let i = 1; i < event.rowspan; i++) skip.add(rowIndex + i);
      }
      return skip;
    });

    return { dayEvents, skipSets };
  }, [sessions, weekDays, pitchCountByField]);

  const todayStr = new Date().toDateString();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <NewBookingButtons onCreated={refetch} />
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
        <table className="min-w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "3.5rem" }} />
            {weekDays.map((_, i) => (
              <col key={i} style={{ width: "calc((100% - 3.5rem) / 7)" }} />
            ))}
          </colgroup>
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

                    const isFull =
                      event.entries.length >= 2 || event.entries[0].isFull;

                    return (
                      <td
                        key={di}
                        rowSpan={event.rowspan}
                        className={`px-2 py-1 border-r border-fkb-border/50 last:border-r-0 align-top text-fkb-dark ${
                          isFull ? "bg-fkb-pale" : ""
                        }`}
                        style={isFull ? undefined : {
                          background: "linear-gradient(to right, var(--color-fkb-pale) 50%, transparent 50%)"
                        }}
                      >
                        {event.entries.map((entry, i) => (
                          <button
                            key={entry.block.key}
                            type="button"
                            onClick={() => setEditingBlock(entry.block)}
                            className={`block w-full text-left hover:underline ${i > 0 ? "mt-1" : ""}`}
                          >
                            <div className="text-xs font-semibold leading-tight truncate">
                              {entry.label}
                            </div>
                            <div className="text-xs text-fkb-mid leading-tight">
                              {entry.fromLabel} – {entry.toLabel}
                            </div>
                          </button>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingBlock && (
        <EditBlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={refetch}
        />
      )}
    </>
  );
}
