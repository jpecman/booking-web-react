import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useContacts, type Contact } from "@/context/ContactsContext";
import EditContactModal from "@/components/EditContactModal";
import DeleteContactModal from "@/components/DeleteContactModal";
import CreateContactModal from "@/components/CreateContactModal";

export default function ContactsPage() {
  const { user } = useAuth();
  const { contacts: data, loading, error, refetch } = useContacts();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Contacts</h1>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCreating(true)}
          disabled={!user}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          New contact
        </button>
        <button
          onClick={refetch}
          disabled={!user || loading}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      {!user && <p className="text-gray-500">Sign in to view contacts.</p>}
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load contacts: {error.message}</p>}
      {data && data.length === 0 && <p className="text-gray-500">No contacts found.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-bg text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Show</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fkb-border/50">
              {data.map((contact) => (
                <tr key={contact.id} className="hover:bg-fkb-bg transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{contact.firstName}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{contact.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.email}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contact.show ? "bg-fkb-pale text-fkb-dark" : "bg-gray-100 text-gray-500"}`}>
                      {contact.show ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditing(contact)}
                        className="text-xs font-medium text-fkb-dark hover:text-fkb-dark px-2 py-1 rounded hover:bg-fkb-pale transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(contact)}
                        className="text-xs font-medium text-fkb-danger hover:text-fkb-danger px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
        <CreateContactModal
          onClose={() => setCreating(false)}
          onCreated={refetch}
        />
      )}

      {editing && (
        <EditContactModal
          contact={editing}
          onClose={() => setEditing(null)}
          onSaved={refetch}
        />
      )}

      {deleting && (
        <DeleteContactModal
          contact={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={refetch}
        />
      )}
    </>
  );
}
