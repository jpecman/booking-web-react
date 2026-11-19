import { useState } from "react";
import { useContacts, type Contact } from "@/context/ContactsContext";
import EditContactModal from "@/components/EditContactModal";
import DeleteContactModal from "@/components/DeleteContactModal";
import CreateContactModal from "@/components/CreateContactModal";

export default function ContactsPage() {
  const { contacts: data, loading, error, refetch } = useContacts();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover disabled:opacity-50 transition-colors"
        >
          New contact
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load contacts: {error.message}</p>}
      {data && data.length === 0 && <p className="text-gray-500">No contacts found.</p>}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-fkb-border">
          <table className="min-w-full divide-y divide-fkb-border bg-white text-sm">
            <thead className="bg-fkb-mid text-left text-xs font-semibold text-white uppercase tracking-wider">
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
                    <span className={`inline-block text-xs font-medium border rounded-lg px-3 py-1.5 ${contact.show ? "bg-fkb-pale text-fkb-dark border-fkb-dark/40" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                      {contact.show ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditing(contact)}
                        className="text-fkb-dark border border-fkb-dark/40 rounded-lg p-1.5 hover:bg-fkb-pale transition-colors"
                        title="Edit contact"
                        aria-label="Edit contact"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4L19.5 8.5a2.5 2.5 0 00-3.536-3.536L4.5 16.5 4 20z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleting(contact)}
                        className="text-fkb-danger border border-fkb-danger/40 rounded-lg p-1.5 hover:bg-red-50 transition-colors"
                        title="Delete contact"
                        aria-label="Delete contact"
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
