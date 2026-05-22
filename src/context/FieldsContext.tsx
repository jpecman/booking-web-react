import { createContext, useContext } from "react";
import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";

export interface Pitch {
  id: string;
  name: string;
}

export interface Field {
  id: string;
  name: string;
  pitches: Pitch[];
}

interface FieldsContextValue {
  fields: Field[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const FieldsContext = createContext<FieldsContextValue | null>(null);

export function FieldsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<Field[]>(
    () => api.get("/v1/Field"),
    [user],
    { enabled: !!user }
  );

  return (
    <FieldsContext.Provider value={{ fields: data, loading, error, refetch }}>
      {children}
    </FieldsContext.Provider>
  );
}

export function useFields() {
  const ctx = useContext(FieldsContext);
  if (!ctx) throw new Error("useFields must be used inside FieldsProvider");
  return ctx;
}
