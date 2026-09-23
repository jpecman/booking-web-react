import { useState } from "react";
import { api } from "@/api/client";
import type { Field } from "@/context/FieldsContext";

interface Props {
  field: Field;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteFieldModal({ field, onClose, onDeleted }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.delete(`/v1/fields/${field.id}`);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete field");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Delete field</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">{field.name}</span>
          ? This action cannot be undone.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-fkb-danger text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
