import { createContext, useContext } from "react";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  show: boolean;
}

interface ContactsContextValue {
  contacts: Contact[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<Contact[]>(
    () => api.get("/v1/contacts"),
    [user],
    { enabled: !!user }
  );

  return (
    <ContactsContext.Provider value={{ contacts: data, loading, error, refetch }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error("useContacts must be used inside ContactsProvider");
  return ctx;
}
