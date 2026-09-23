import { useState } from "react";
import { api } from "@/api/client";
import type { Field, Pitch } from "@/context/FieldsContext";

interface Props {
  field: Field;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditFieldModal({ field, onClose, onSaved }: Props) {
  const [name, setName] = useState(field.name ?? "");
  const [pitches, setPitches] = useState<Pitch[]>(field.pitches ?? []);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);

  const [newPitchName, setNewPitchName] = useState("");
  const [addingPitch, setAddingPitch] = useState(false);

  const startEdit = (pitch: Pitch) => {
    setEditingId(pitch.id);
    setEditingName(pitch.name ?? "");
    setPitchError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const confirmRename = async (pitchId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setPitchError(null);
    setRenamingId(pitchId);
    try {
      const updated = await api.put<Pitch>(`/v1/pitches/${pitchId}`, { name: trimmed });
      setPitches((ps) => ps.map((p) => (p.id === pitchId ? updated : p)));
      setEditingId(null);
      onSaved();
    } catch (err) {
      setPitchError(err instanceof Error ? err.message : "Failed to rename pitch");
    } finally {
      setRenamingId(null);
    }
  };

  const deletePitch = async (pitchId: string) => {
    setPitchError(null);
    setDeletingId(pitchId);
    try {
      await api.delete(`/v1/pitches/${pitchId}`);
      setPitches((ps) => ps.filter((p) => p.id !== pitchId));
      onSaved();
    } catch (err) {
      setPitchError(err instanceof Error ? err.message : "Failed to delete pitch");
    } finally {
      setDeletingId(null);
    }
  };

  const addPitch = async () => {
    const trimmed = newPitchName.trim();
    if (!trimmed) return;
    setPitchError(null);
    setAddingPitch(true);
    try {
      const created = await api.post<Pitch>("/v1/pitches", { fieldId: field.id, name: trimmed });
      setPitches((ps) => [...ps, created]);
      setNewPitchName("");
      onSaved();
    } catch (err) {
      setPitchError(err instanceof Error ? err.message : "Failed to add pitch");
    } finally {
      setAddingPitch(false);
    }
  };

  const handleNewPitchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPitch();
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);
    try {
      await api.put(`/v1/fields/${field.id}`, { name });
      onSaved();
      onClose();
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to save field");
    } finally {
      setSavingName(false);
    }
  };

  const pitchBusy = addingPitch || !!renamingId || !!deletingId;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSaveName} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Pitches</label>

            {pitches.map((pitch) => (
              <div key={pitch.id} className="flex items-center gap-2">
                {editingId === pitch.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmRename(pitch.id); } }}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => confirmRename(pitch.id)}
                      disabled={renamingId === pitch.id}
                      className="text-xs font-medium text-fkb-dark border border-fkb-dark/40 rounded-lg px-3 py-1.5 hover:bg-fkb-pale transition-colors disabled:opacity-50"
                    >
                      {renamingId === pitch.id ? "…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-800">{pitch.name}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(pitch)}
                      disabled={pitchBusy}
                      className="text-xs font-medium text-fkb-dark border border-fkb-dark/40 rounded-lg px-3 py-1.5 hover:bg-fkb-pale transition-colors disabled:opacity-50"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePitch(pitch.id)}
                      disabled={deletingId === pitch.id || pitchBusy}
                      className="text-xs font-medium text-fkb-danger border border-fkb-danger/40 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === pitch.id ? "…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            ))}

            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={newPitchName}
                onChange={(e) => setNewPitchName(e.target.value)}
                onKeyDown={handleNewPitchKeyDown}
                placeholder="New pitch name"
                disabled={addingPitch}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid disabled:opacity-50"
              />
              <button
                type="button"
                onClick={addPitch}
                disabled={addingPitch || !newPitchName.trim()}
                className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {addingPitch ? "…" : "Add"}
              </button>
            </div>
          </div>

          {pitchError && <p className="text-red-600 text-sm">{pitchError}</p>}
          {nameError && <p className="text-red-600 text-sm">{nameError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingName}
              className="bg-fkb-mid text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-fkb-hover disabled:opacity-50 transition-colors"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
