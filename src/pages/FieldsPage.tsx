import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFields, type Field } from "@/context/FieldsContext";
import CreateFieldModal from "@/components/CreateFieldModal";
import EditFieldModal from "@/components/EditFieldModal";
import DeleteFieldModal from "@/components/DeleteFieldModal";

export default function FieldsPage() {
  const { user } = useAuth();
  const { fields, loading, error, refetch } = useFields();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState<Field | null>(null);

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Fields</h1>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCreating(true)}
          disabled={!user}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          New field
        </button>
        <button
          onClick={refetch}
          disabled={!user || loading}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      {!user && <p className="text-gray-500">Sign in to view fields.</p>}
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load fields: {error.message}</p>}
      {fields && fields.length === 0 && <p className="text-gray-500">No fields found.</p>}

      {fields && fields.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-bg text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                          <span key={pitch.id} className="bg-fkb-pale text-fkb-dark text-xs font-medium px-2 py-0.5 rounded-full">
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
                        className="text-xs font-medium text-fkb-dark border border-fkb-dark/40 rounded-lg px-3 py-1.5 hover:bg-fkb-pale transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(field)}
                        className="text-xs font-medium text-fkb-danger border border-fkb-danger/40 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        Delete
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
