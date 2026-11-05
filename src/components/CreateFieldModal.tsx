import { useState } from "react";
import { api } from "@/api/client";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateFieldModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [pitches, setPitches] = useState<string[]>([]);
  const [pitchInput, setPitchInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addPitch = () => {
    const trimmed = pitchInput.trim();
    if (trimmed && !pitches.includes(trimmed)) {
      setPitches((p) => [...p, trimmed]);
    }
    setPitchInput("");
  };

  const removePitch = (pitch: string) =>
    setPitches((p) => p.filter((x) => x !== pitch));

  const handlePitchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPitch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/v1/fields", { name, pitches });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create field");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Pitches</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pitchInput}
                onChange={(e) => setPitchInput(e.target.value)}
                onKeyDown={handlePitchKeyDown}
                placeholder="Pitch name"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
              <button
                type="button"
                onClick={addPitch}
                className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {pitches.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {pitches.map((p) => (
                  <span key={p} className="flex items-center gap-1 bg-fkb-pale text-fkb-dark text-xs font-medium px-2 py-0.5 rounded-full">
                    {p}
                    <button type="button" onClick={() => removePitch(p)} className="hover:text-fkb-dark">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-fkb-mid text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-fkb-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
