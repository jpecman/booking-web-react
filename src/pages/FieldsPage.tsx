import { useState } from "react";
import { useFields, type Field } from "@/context/FieldsContext";
import CreateFieldModal from "@/components/CreateFieldModal";
import EditFieldModal from "@/components/EditFieldModal";
import DeleteFieldModal from "@/components/DeleteFieldModal";

export default function FieldsPage() {
  const { fields, loading, error, refetch } = useFields();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState<Field | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fields</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          New field
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load fields: {error.message}</p>}
      {fields && fields.length === 0 && <p className="text-gray-500">No fields found.</p>}

      {fields && fields.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-mid text-left text-xs font-semibold text-white uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Pitches</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fkb-border/50">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-fkb-bg transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{field.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {field.pitches && field.pitches.length > 0 ? (
                        field.pitches.map((pitch) => (
                          <span key={pitch.id} className="bg-fkb-pale text-fkb-dark border border-fkb-dark/40 text-xs font-medium px-3 py-1.5 rounded-lg">
                            {pitch.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditing(field)}
                        className="text-fkb-dark border border-fkb-dark/40 rounded-lg p-1.5 hover:bg-fkb-pale transition-colors"
                        title="Edit field"
                        aria-label="Edit field"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4L19.5 8.5a2.5 2.5 0 00-3.536-3.536L4.5 16.5 4 20z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleting(field)}
                        className="text-gray-500 border border-gray-300 rounded-lg p-1.5 hover:text-fkb-danger hover:border-fkb-danger/40 hover:bg-red-50 transition-colors"
                        title="Delete field"
                        aria-label="Delete field"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateFieldModal
          onClose={() => setCreating(false)}
          onCreated={refetch}
        />
      )}

      {editing && (
        <EditFieldModal
          field={editing}
          onClose={() => setEditing(null)}
          onSaved={refetch}
        />
      )}

      {deleting && (
        <DeleteFieldModal
          field={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={refetch}
        />
      )}
    </>
  );
}
