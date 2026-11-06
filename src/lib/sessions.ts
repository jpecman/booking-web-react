import type { Field } from "@/context/FieldsContext";

export interface SessionSlotInput {
  id: string;
  name: string | null;
  from: string;
  to: string;
  pitchId: string;
  price?: number;
  bookingId?: string;
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

  sessions.sort(
    (a, b) => a.from.getTime() - b.from.getTime() || a.to.getTime() - b.to.getTime()
  );

  return sessions;
}

export interface BlockSlot {
  id: string;
  bookingId: string;
  pitchId: string;
  name: string | null;
  price: number;
}

/**
 * One time range on one field. The slots may belong to different bookings
 * (e.g. each half of the field booked separately); they are ordered by pitchId.
 */
export interface Block {
  key: string;
  fieldId: string;
  from: Date;
  to: Date;
  slots: BlockSlot[];
  totalPrice: number;
  isWholeField: boolean;
}

export function groupBlocks(
  bookings: BookingWithSlots[],
  fields: Field[] | null
): Block[] {
  // Without fields we can't tell which pitches belong together.
  if (!fields) return [];

  const fieldByPitchId = new Map<string, Field>();
  for (const field of fields) {
    for (const pitch of field.pitches) fieldByPitchId.set(pitch.id, field);
  }

  const byKey = new Map<string, { field: Field; from: string; to: string; slots: BlockSlot[] }>();
  for (const booking of bookings) {
    for (const slot of booking.slots ?? []) {
      const field = fieldByPitchId.get(slot.pitchId);
      if (!field) continue;

      const key = `${field.id}|${slot.from}|${slot.to}`;
      const blockSlot: BlockSlot = {
        id: slot.id,
        bookingId: slot.bookingId ?? booking.id,
        pitchId: slot.pitchId,
        name: slot.name,
        price: slot.price ?? 0,
      };
      const group = byKey.get(key);
      if (group) group.slots.push(blockSlot);
      else byKey.set(key, { field, from: slot.from, to: slot.to, slots: [blockSlot] });
    }
  }

  const blocks: Block[] = [];
  for (const [key, { field, from, to, slots }] of byKey) {
    slots.sort((a, b) => a.pitchId.localeCompare(b.pitchId));

    const pitchesByBooking = new Map<string, Set<string>>();
    for (const slot of slots) {
      const pitches = pitchesByBooking.get(slot.bookingId);
      if (pitches) pitches.add(slot.pitchId);
      else pitchesByBooking.set(slot.bookingId, new Set([slot.pitchId]));
    }
    const isWholeField = [...pitchesByBooking.values()].some(
      (pitches) => pitches.size === field.pitches.length
    );

    blocks.push({
      key,
      fieldId: field.id,
      from: new Date(from),
      to: new Date(to),
      slots,
      totalPrice: slots.reduce((sum, s) => sum + s.price, 0),
      isWholeField,
    });
  }

  return blocks;
}
