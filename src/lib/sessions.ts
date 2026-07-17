import type { Field } from "@/context/FieldsContext";

export interface SessionSlotInput {
  id: string;
  name: string | null;
  from: string;
  to: string;
  pitchId: string;
  price?: number;
}

export interface BookingWithSlots {
  id: string;
  name?: string | null;
  slots: SessionSlotInput[] | null;
}

/**
 * One time range of one booking. A whole-field booking stores a slot per pitch;
 * grouped here they become a single session with isWholeField set.
 */
export interface Session {
  key: string;
  bookingId: string;
  label: string | null;
  from: Date;
  to: Date;
  slotIds: string[];
  pitchIds: string[];
  totalPrice: number;
  isWholeField: boolean;
}

export function groupSessions(
  bookings: BookingWithSlots[],
  fields: Field[] | null
): Session[] {
  const fieldByPitchId = new Map<string, Field>();
  for (const field of fields ?? []) {
    for (const pitch of field.pitches) fieldByPitchId.set(pitch.id, field);
  }

  const sessions: Session[] = [];

  for (const booking of bookings) {
    const byRange = new Map<string, SessionSlotInput[]>();
    for (const slot of booking.slots ?? []) {
      const rangeKey = `${slot.from}|${slot.to}`;
      const group = byRange.get(rangeKey);
      if (group) group.push(slot);
      else byRange.set(rangeKey, [slot]);
    }

    for (const [rangeKey, slots] of byRange) {
      const pitchIds = [...new Set(slots.map((s) => s.pitchId))];
      const field = fieldByPitchId.get(pitchIds[0]);
      // Until fields are loaded, fall back to "more than one pitch".
      const isWholeField = field
        ? pitchIds.length === field.pitches.length &&
          pitchIds.every((id) => fieldByPitchId.get(id) === field)
        : pitchIds.length > 1;

      sessions.push({
        key: `${booking.id}|${rangeKey}`,
        bookingId: booking.id,
        label: slots[0].name ?? booking.name ?? null,
        from: new Date(slots[0].from),
        to: new Date(slots[0].to),
        slotIds: slots.map((s) => s.id),
        pitchIds,
        totalPrice: slots.reduce((sum, s) => sum + (s.price ?? 0), 0),
        isWholeField,
      });
    }
  }

  return sessions;
}
